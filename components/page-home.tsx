import { Component } from "react"
import { headerBackgroundColor } from "../lib/constants"

import { Layout } from 'antd'
const { Header } = Layout

interface Props {
    entityDetails: object,
    currentAddress: string,
    refresh?: () => void
}
interface State {
}

export default class PageHome extends Component<Props, State> {

    state = {
    }

    render() {
        return <>
            <Header style={{ backgroundColor: headerBackgroundColor }}>
                { /* TITLE? */}
            </Header>

            <div style={{ padding: '24px ', paddingTop: 0, background: '#fff' }}>
                <div style={{ padding: 30 }}>
                    <h2>Welcome page</h2>
                    <pre>{JSON.stringify(this.props.entityDetails, null, 2)}</pre>
                    <div>{this.props.currentAddress}</div>
                </div>
            </div>
        </>
    }
}