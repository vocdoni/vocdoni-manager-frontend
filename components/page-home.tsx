import { Component } from "react"
import { headerBackgroundColor } from "../lib/constants"
import { getState } from "../util/dvote"
import { Layout } from 'antd'
const { Header } = Layout
import { EntityMetadata } from "dvote-js"

interface Props {
    refresh?: () => void
}
interface State {
    accountAddress: string,
    entityInfo: EntityMetadata
}

export default class PageHome extends Component<Props, State> {

    state = {
        accountAddress: "",
        entityInfo: null,
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
        const prevEntityInfo = this.state.entityInfo

        // Changes? => sync
        const { address, entityInfo } = getState();
        if (prevAddress != address || prevEntityInfo != entityInfo) {
            this.setState({
                accountAddress: address,
                entityInfo
            })
        }
    }

    render() {
        return <>
            <Header style={{ backgroundColor: headerBackgroundColor }}>
                { /* TITLE? */}
            </Header>

            <div style={{ padding: '24px ', paddingTop: 0, background: '#fff' }}>
                <div style={{ padding: 30 }}>
                    <h2>Welcome page</h2>
                    <pre>{JSON.stringify(this.state.entityInfo, null, 2)}</pre>
                    <div>{this.state.accountAddress}</div>
                </div>
            </div>
        </>
    }
}