import { Component } from "react"
// import {
//     Input,
//     Icon,
//     Divider,
//     Button,
//     notification
// } from 'antd'

// import Web3Manager from "../util/ethereum-manager";
// import { AccountState } from "../util/ethereum-manager";
// import { Utils } from "../util/node_modules/dvote-client" // TODO: upgrade dvote-js
// import DvoteUtil from "../util/dvoteUtil";

// const votingAddress = process.env.VOTING_PROCESS_CONTRACT_ADDRESS

interface Props {
    // dvote: DvoteUtil
}
interface State {
    processName: string,
    question: string,
    option1: string,
    option2: string,
    censusMerkleRoot: string,
    censusProofUrl: string,
    voteEncryptionPublicKey: string
}

export default class NewProcess extends Component<Props, State> {
    // dvote: DvoteUtil

    // state = {
    //     processName: "",
    //     question: "",
    //     option1: "",
    //     option2: "",
    //     censusId: "testnet",
    //     censusMerkleRoot: "",
    //     censusProofUrl: process.env.CENSUS_SERVICE_URL,
    //     voteEncryptionPublicKey: ""
    // }

    // onChangeProcessName = (e) => {
    //     this.setState({ processName: e.target.value });
    // }

    // onChangeQuestion = (e) => {
    //     this.setState({ question: e.target.value });
    // }

    // onChangeOption1 = (e) => {
    //     this.setState({ option1: e.target.value });
    // }

    // onChangeOption2 = (e) => {
    //     this.setState({ option2: e.target.value });
    // }

    // onChangeCensusMerkleRoot = (e) => {
    //     this.setState({ censusMerkleRoot: e.target.value });
    // }

    // onClickFetchCensusMerkleRoot = async () => {

    //     let accountState = await Web3Manager.getAccountState()
    //     if (accountState != AccountState.Ok) {
    //         alert(accountState)
    //         return
    //     }

    //     this.setState({ censusMerkleRoot: '(fetching...)' })
    //     try {
    //         this.dvote = new DvoteUtil()
    //         this.dvote.initProcess(Web3Manager.getInjectedProvider(), votingAddress)

    //         let merkleRoot = await this.dvote.census.getRoot(this.state.censusId)
    //         this.setState({ censusMerkleRoot: merkleRoot })
    //     }
    //     catch (err) {
    //         this.setState({ censusMerkleRoot: "" })
    //         notification.error({
    //             message: "Error",
    //             description: "The census root hash could not be retrieved"
    //         })
    //     }
    // }

    // onChangeCensusProofUrl = (e) => {
    //     this.setState({ censusProofUrl: e.target.value });
    // }

    // onChangeVoteEncryptionPublicKey = (e) => {
    //     this.setState({ voteEncryptionPublicKey: e.target.value });
    // }

    // onClickFillItForMe = () => {
    //     this.setState({
    //         processName: "Basic income rule",
    //         question: "Should basic income be a human right?",
    //         option1: "Yes",
    //         option2: "No",
    //         censusProofUrl: process.env.CENSUS_SERVICE_URL,
    //         voteEncryptionPublicKey: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
    //     })
    // }

    // onClickCreateProcess = async () => {
    //     if (!this.state.processName ||
    //         !this.state.question ||
    //         !this.state.option1 ||
    //         !this.state.option2 ||
    //         !this.state.censusMerkleRoot ||
    //         !this.state.censusProofUrl ||
    //         !this.state.voteEncryptionPublicKey) {
    //         notification.error({
    //             message: "Error",
    //             description: "Some inputs are missing"
    //         });
    //         return
    //     }

    //     if (!Utils.stringFitsInBytes32(this.state.option1) ||
    //         !Utils.stringFitsInBytes32(this.state.option2) ||
    //         !Utils.hexFitsInBytes32(this.state.censusMerkleRoot)) {
    //         notification.error({
    //             message: "Error",
    //             description: "A bytes32 value is too long. Check: Voting options and censusMerkelRoot"
    //         });
    //         return
    //     }

    //     let accountState = await Web3Manager.getAccountState()
    //     if (accountState != AccountState.Ok) {
    //         notification.error({
    //             message: "Error",
    //             description: "Your account is not ready"
    //         });
    //         return
    //     }

    //     let organizerAddress = await Web3Manager.getAddress()


    //     let votingOptions = [
    //         this.state.option1,
    //         this.state.option2
    //     ]

    //     const processMetadata = {
    //         censusProofUrl: this.state.censusProofUrl,
    //         censusMerkleRoot: this.state.censusMerkleRoot,
    //         censusRequestUrl: "This should not be here", //TODO:
    //         name: this.state.processName,
    //         question: this.state.question,
    //         startBlock: 0,
    //         endBlock: 100,
    //         voteEncryptionPublicKey: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
    //         votesBatch1: "0x1111111111111111111111111111111111111111111111111111111111111111",
    //         votingOptions: votingOptions,
    //     };

    //     this.dvote = new DvoteUtil()
    //     this.dvote.initProcess(Web3Manager.getInjectedProvider(), votingAddress)

    //     let transaction = await this.dvote.process.create(processMetadata, organizerAddress)
    //     console.log("receipt", transaction)

    //     let processId = await this.dvote.process.getId(processMetadata.name, organizerAddress);
    //     console.log('processId', processId)

    //     let existingProcesses = await this.dvote.process.getProcessesIdsByOrganizer(organizerAddress);
    //     console.log('existingProesses', existingProcesses)

    //     let metadata = await this.dvote.process.getMetadata(existingProcesses[existingProcesses.length - 1]);
    //     console.log('lastProcessMetadata', metadata)

    //     notification.success({
    //         message: "Success",
    //         description: "Contratulations, a new process has been created!"
    //     })
    // }

    // render() {
    //     return <div>
    //         <style jsx>{`
    //             h4 {
    //                 margin-top: 10px;
    //             }
    //         `}</style>
    //         <h4>Process Name</h4>
    //         <Input
    //             placeholder="Basic income rule"
    //             prefix={<Icon type="info-circle" style={{ color: 'rgba(0,0,0,.25)' }} />}
    //             value={this.state.processName}
    //             onChange={this.onChangeProcessName}
    //         />

    //         <Divider>Question</Divider>

    //         <h4>Question</h4>
    //         <Input
    //             placeholder="Should basic income be a human right?"
    //             prefix={<Icon type="question-circle" style={{ color: 'rgba(0,0,0,.25)' }} />}
    //             value={this.state.question}
    //             onChange={this.onChangeQuestion}
    //         />

    //         <h4>Option #1</h4>
    //         <Input
    //             placeholder="Yes"
    //             prefix={<Icon type="setting" style={{ color: 'rgba(0,0,0,.25)' }} />}
    //             value={this.state.option1}
    //             onChange={this.onChangeOption1}
    //         />

    //         <h4>Option #2</h4>
    //         <Input
    //             placeholder="No"
    //             prefix={<Icon type="setting" style={{ color: 'rgba(0,0,0,.25)' }} />}
    //             value={this.state.option2}
    //             onChange={this.onChangeOption2}
    //         />

    //         <Divider>Census ({this.state.censusId})</Divider>

    //         <h4>Merkle-Root</h4>

    //         <Input.Search
    //             placeholder="The root hash of the census Merkle-tree"
    //             prefix={<Icon type="fork" style={{ color: 'rgba(0,0,0,.25)' }} />}
    //             value={this.state.censusMerkleRoot}
    //             onChange={this.onChangeCensusMerkleRoot}
    //             onSearch={this.onClickFetchCensusMerkleRoot}
    //             enterButton={"Get"}
    //         />

    //         <h4>Census service URL</h4>

    //         <Input
    //             placeholder="For a voter to verify if she is in the census"
    //             prefix={<Icon type="link" style={{ color: 'rgba(0,0,0,.25)' }} />}
    //             value={this.state.censusProofUrl}
    //             onChange={this.onChangeCensusProofUrl}
    //         />

    //         <Divider>Encryption</Divider>

    //         <h4>Vote encryption key</h4>
    //         <Input
    //             placeholder="Public key that users will use to cypher their votes"
    //             prefix={<Icon type="key" style={{ color: 'rgba(0,0,0,.25)' }} />}
    //             value={this.state.voteEncryptionPublicKey}
    //             onChange={this.onChangeVoteEncryptionPublicKey}
    //         />

    //         <Divider />

    //         <div style={{ textAlign: "center" }}>
    //             <Button size='large' style={{ marginLeft: 8 }} type='ghost' onClick={() => this.onClickFillItForMe()}>🍨</Button>

    //             <Button size='large' style={{ marginLeft: 8 }} type='primary' onClick={() => this.onClickCreateProcess()}>Create Process</Button>
    //         </div>

    //     </div>

    // }
}
