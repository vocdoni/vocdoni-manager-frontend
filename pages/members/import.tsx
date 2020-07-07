import React, { useContext, Component } from 'react'
import AppContext, { IAppContext } from '../../components/app-context'
import { Row, Col, Divider, Table, Button, Form, Checkbox, InputNumber, message } from 'antd'
import { getNetworkState } from '../../lib/network'
import Router from 'next/router'
import { InboxOutlined } from '@ant-design/icons'
import Dragger from 'antd/lib/upload/Dragger'
import { RcFile } from 'antd/lib/upload'
import XLSX from 'xlsx';
var Buffer = require('buffer/').Buffer

import CsvParse from 'csv-parse/lib/sync'

const MemberImportPage = props => {
  const context = useContext(AppContext)
  return <MemberImport {...context} />
}

type State = {
  entityId?: string,
  data: {firstName: string, lastName: string, email: string}[],
  file?: RcFile,
  fileType?: string,
  rawImport?: any,
  importedColumnsAmount: number,
  firstNameColNumber: number,
  lastNameColNumber: number,
  emailColNumber: number,
  csvDelimiter: string
  fromLine: number,
  uploading: boolean,
  loading: boolean,
  error?: any,
}

class MemberImport extends Component<IAppContext, State> {
  state: State = {
    uploading: false,
    csvDelimiter: ',',
    fromLine: 2,
    importedColumnsAmount: 999,
    firstNameColNumber: 1,
    lastNameColNumber: 2,
    emailColNumber: 3,
    loading: false,
    data: [],
  }

  async componentDidMount() {
    if (getNetworkState().readOnly) {
      return Router.replace("/entities" + location.hash)
    }

    this.props.setMenuSelected("members-import")

    const hash = location.hash.split('/')
    const entityId = hash[1]
    this.setState({ entityId })
  }

  onChangeSkipFirstRow(checked){
    const fromLine: number = (checked) ? 2:1
    this.setState({ fromLine }, this.processImport)
  }

  onChangeFirstNameColNumber(value){
    this.setState({ firstNameColNumber: value }, this.processImport)
  }
  onChangeLastNameColNumber(value){
    this.setState({ lastNameColNumber: value }, this.processImport)
  }
  onChangeEmailColNumber(value){
    this.setState({ emailColNumber: value }, this.processImport)
  }

  beforeUpload(file: RcFile){  
    const reader = new FileReader()
    reader.onload = e => {
      this.setState({ 
        rawImport: Buffer.from(e.target.result),
        fileType: file.type,
       }, this.processImport )
    }

    reader.readAsArrayBuffer(file)

    return false
  }

  processImport(file?){
    const raw = (file) ? file:this.state.rawImport
    let data: any[] = []

    if(this.state.fileType === "text/csv") {
      const records = CsvParse(raw, {
        skip_empty_lines: true,
        delimiter: this.state.csvDelimiter,
        from_line: this.state.fromLine,
        trim: true,
      })

      if(records.length > 0){
        this.setState({ importedColumnsAmount: records[0].length })
      }

      for(const row of records){
        data.push({
          firstName: row[this.state.firstNameColNumber-1], 
          lastName: row[this.state.lastNameColNumber-1], 
          email: row[this.state.emailColNumber-1], 
        })
      }
    } else {
      data = this.parseMembersFromExcel(raw, 
                                        this.state.firstNameColNumber-1,
                                        this.state.lastNameColNumber-1,
                                        this.state.emailColNumber-1,
                                        this.state.fromLine-1)
    }

    this.setState({ data })
  }

  parseMembersFromExcel(fileData: Buffer, nameColumnIndex: number, lastNameColumnIndex: number, emailColumnIndex: number, fromLine: number) {
    try {
      const workbook = XLSX.read(fileData, { type: "buffer" })
      const firstSheetName = workbook.SheetNames[0]
      if (!firstSheetName) throw new Error("The document does not contain a worksheet")
      const worksheet = workbook.Sheets[firstSheetName]
      if (!worksheet) throw new Error("The document does not contain a worksheet")
      const rangeMatches = worksheet["!ref"].match(/^([A-Z]+)([0-9]+):([A-Z]+)([0-9]+)$/)
      if (!rangeMatches) throw new Error("Invalid document range")

      const nameCol = this.colAdd(rangeMatches[1], nameColumnIndex)
      const lastNameCol = this.colAdd(rangeMatches[1], lastNameColumnIndex)
      const emailCol = this.colAdd(rangeMatches[1], emailColumnIndex)
      const startRow = parseInt(rangeMatches[2])+fromLine
      const endRow = parseInt(rangeMatches[4])
  
      const result: { firstName: string, lastName: string, email: string }[] = []
      for (let i = startRow; i <= endRow; i++) {
        if (!worksheet[`${nameCol}${i}`] || !worksheet[`${emailCol}${i}`]) {
          console.warn("Warning: Found empty values in row #" + i)
          continue
        }
        else if (typeof worksheet[`${nameCol}${i}`].v != "string" || typeof worksheet[`${emailCol}${i}`].v != "string") {
          console.warn("Warning: Found invalid values in row #" + i)
          continue
        }
  
        result.push({
          firstName: worksheet[`${nameCol}${i}`].v,
          lastName: worksheet[`${lastNameCol}${i}`].v || "",
          email: worksheet[`${emailCol}${i}`].v,
        })
      }
      return result
    } catch (err) {
      throw new Error("The Excel file can't be processed")
    }
  }

  colAdd(column: string, amount: number = 1) {
    if (!column || !column.match(/^[A-Z]+$/)) throw new Error("Invalid column")
    else if (amount < 0) throw new Error("Invalid parameters")
  
    column = column.toUpperCase()
    // RANGE: 65 (A) to 90 (Z)
    const charCodes = column.split("").map(c => c.charCodeAt(0) - 65)
  
    // RANGE: 0 (A) to 25 (Z)
  
    charCodes[charCodes.length - 1] += amount
    for (let i = charCodes.length - 1; i >= 0; i--) {
      if (charCodes[i] <= 25) continue
      const carry = Math.floor(charCodes[i] / 26)
      charCodes[i] = charCodes[i] % 26 // remainder
  
      if (i == 0) {
        charCodes.unshift(carry - 1)
        if (carry < 26) break
        else i++  // the carry is larger than one extra char => keep adding
      }
      else {
        charCodes[i - 1] += carry
      }
    }
  
    return charCodes.map(c => String.fromCharCode(c + 65)).join("")
  }

  handleUpload() {
    this.setState({ uploading: true })

    const request = { 
      membersInfo: this.state.data,
      method: "importMembers",
    }

    this.props.registryGateway.sendMessage(request as any, this.props.web3Wallet.getWallet())
      .then((result) => {
        if(!result.ok){
          const error = "Could not import the members"
          message.error(error)
          this.setState({error})
          return false
        }
        message.success("Members have been imported")
      },
      (error) => {
        message.error("Could not import the members")
        this.setState({error})
      })
  };

  render() {
    const columns = [
      { title: 'Name', dataIndex: 'firstName', key: 'firstName' },
      { title: 'Last Name', dataIndex: 'lastName', key: 'lastName' },
      { title: 'Email', dataIndex: 'email', key: 'email' }
    ]

    return <div id="page-body">
      <div className="body-card">
        <Row gutter={40} justify="start">
          <Col span={10}>
            <Row>
              <Col span="24">
                <section>
                <Divider orientation="left">Upload data</Divider>
                <Dragger 
                  beforeUpload={(file) => this.beforeUpload(file)} 
                  accept={'.csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}
                >
                  <p className="ant-upload-drag-icon">
                    <InboxOutlined />
                  </p>
                  <p className="ant-upload-text">Click or drag file to this area to upload</p>
                  <p className="ant-upload-hint">Supported file formats are XLSX and CSV</p>
                </Dragger>
                </section>
              </Col>
            </Row>

            <Row>
              <Col>
                <Divider orientation="left">Column selection</Divider>
                <p>Select the column number that corresponds to the following fields</p>

                <Row>
                  <Col span={8}>
                    <Form.Item label="Name" required={true}>
                      <InputNumber 
                        min={1} max={this.state.importedColumnsAmount} 
                        value={this.state.firstNameColNumber} 
                        onChange={ value => this.onChangeFirstNameColNumber(value) }
                        />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="Last Name" required={true}>
                      <InputNumber min={1} max={this.state.importedColumnsAmount} 
                        value={this.state.lastNameColNumber}
                        onChange={ value => this.onChangeLastNameColNumber(value) } />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="Email" required={true}>
                      <InputNumber min={1} max={this.state.importedColumnsAmount} 
                        value={this.state.emailColNumber} 
                        onChange={ value => this.onChangeEmailColNumber(value) }
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Checkbox defaultChecked onChange={e => this.onChangeSkipFirstRow(e.target.checked)}>Skip the first row</Checkbox>
              </Col>
            </Row>
            
            <Row>
              <Col>
                <Divider orientation="left">Confirm import</Divider>
                <p>When you are ready to import the above contents, click on the button to continue.</p>
                <Button type="primary" size="large" onClick={e => this.handleUpload()}>Import data</Button>
              </Col>
            </Row>
          </Col>
          <Col span={14}>
            <Divider orientation="left">Data preview</Divider>
            <Table 
                rowKey="firstname"
                columns={columns}
                dataSource={this.state.data} 
                loading={this.state.loading}
              />
          </Col>
        </Row>
      </div>
    </div>
  }
}

export default MemberImportPage