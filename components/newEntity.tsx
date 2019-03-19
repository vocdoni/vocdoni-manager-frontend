import { Component } from "react"
import {
    Input,
    Icon,
    Button,
    Divider,
    notification
} from 'antd'

import DvoteUtil from "../utils/dvoteUtil";

interface State {
    entityName: string,
    censusRequestUrl: string,
}

interface Props {
    dvote: DvoteUtil
    defaultCensusRequestUrl: string
    currentAddress: string,
}

export default class NewEntity extends Component<Props, State> {

    state = {
        entityName: "",
        censusRequestUrl: ""
    }

    componentDidMount = () => {
        this.setState({ censusRequestUrl: this.props.defaultCensusRequestUrl })
    }

    onChangeEntityName = (e) => {
        this.setState({ entityName: e.target.value });
    }

    onChangeCensusRequestUrl = (e) => {
        this.setState({ censusRequestUrl: e.target.value });
    }

    onClickCreateEntity = async () => {
        if (!this.state.entityName || !this.state.censusRequestUrl) {
            return notification.error({
                message: "Error",
                description: "Please, complete the details of the entity to create it"
            })
        }

        const processMetadata = {
            name: this.state.entityName,
            censusRequestUrl: this.state.censusRequestUrl
        };

        try {
            let transaction = await this.props.dvote.entity.create(processMetadata, this.props.currentAddress)
            console.log(transaction)
        }
        catch (err) {
            notification.error({
                message: "Error",
                description: err && err.message || err || "The transaction could not be sent"
            })
        }
    }

    render() {
        return <div style={{ padding: 50 }}>

            <h2>Create a new entity</h2>
            <p>Your account has not created an entity yet. Fill in the details of the entity to create one.</p>

            <Divider />

            <h3>Entity Name</h3>
            <Input
                placeholder="Entity's Official Name"
                prefix={<Icon type="info-circle" style={{ color: 'rgba(0,0,0,.25)' }} />}
                value={this.state.entityName}
                onChange={this.onChangeEntityName}
            />

            <br />
            <br />
            <h3>Census request URL</h3>
            <Input
                placeholder="End-point for users to request to be in the census"
                prefix={<Icon type="link" style={{ color: 'rgba(0,0,0,.25)' }} />}
                value={this.state.censusRequestUrl}
                onChange={this.onChangeCensusRequestUrl}
            />

            <Divider />

            <div style={{ textAlign: "center" }}>
                <Button size='large' style={{ marginLeft: 8 }} type='primary' onClick={() => this.onClickCreateEntity()}>Create new Entity</Button>
            </div>

        </div>
    }
}
