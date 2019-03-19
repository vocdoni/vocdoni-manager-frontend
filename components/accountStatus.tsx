import { Component } from "react"

interface Props {
    currentAddress: string,
    entityDetails: any
}

export default class AccountStatus extends Component<Props> {
    render() {
        // let shortAddress = this.props.currentAddress.substring(0, 12) + "...";

        if (this.props.entityDetails && this.props.entityDetails.name)
            return <div style={{ textAlign: "right" }}>
                <p style={{ color: "#eee", fontWeight: "bold" }}>{this.props.entityDetails.name}</p>
            </div>
        else if (this.props.currentAddress)
            return <div style={{ textAlign: "right" }}>
                <p style={{ color: "#ddd" }}>(No entity)</p>
            </div>
        return <div style={{ textAlign: "right" }}>
            <p style={{ color: "#ddd" }}>(No account)</p>
        </div>
    }
}

