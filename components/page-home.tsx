import { Component } from "react"

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
        return <div style={{ padding: 30 }}>
            <h2>Welcome page</h2>
            <pre>{JSON.stringify(this.props.entityDetails, null, 2)}</pre>
            <div>{this.props.currentAddress}</div>
        </div>
    }
}