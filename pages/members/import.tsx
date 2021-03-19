import React, { useContext, Component, ReactNode } from 'react'
import { Row, Col, Divider, Table, Button, message } from 'antd'
import Router from 'next/router'
import { DownloadOutlined } from '@ant-design/icons'
import Dragger from 'antd/lib/upload/Dragger'
import { RcFile } from 'antd/lib/upload'

import { getNetworkState } from '../../lib/network'
import { MemberImportData } from '../../lib/types'
import { getSpreadsheetReaderForFile } from '../../lib/import-utils'
import AppContext, { IAppContext } from '../../components/app-context'
import DisabledLayer from '../../components/disabled-layer'
import MembersAddForm from '../../components/members-add-form'
import i18n from '../../i18n'
import Ficon from '../../components/ficon'

const MemberImportPage = () : ReactNode => {
    const context = useContext(AppContext)

    return <MemberImport {...context} />
}

type State = {
    address?: string,
    data: MemberImportData[],
    file?: RcFile,
    importedColumnsAmount: number,
    firstNameColNumber: number,
    lastNameColNumber: number,
    emailColNumber: number,
    fromLine: number,
    uploading: boolean,
    loading: boolean,
    error?: any,
}

class MemberImport extends Component<IAppContext, State> {
    state: State = {
        uploading: false,
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

        const [address] = this.props.params
        this.setState({ address })
    }

    onChangeSkipFirstRow(checked) {
        const fromLine: number = (checked) ? 2 :1
        this.setState({ fromLine }, this.processImport)
    }

    onChangeFirstNameColNumber(value) {
        this.setState({ firstNameColNumber: value }, this.processImport)
    }

    onChangeLastNameColNumber(value) {
        this.setState({ lastNameColNumber: value }, this.processImport)
    }

    onChangeEmailColNumber(value) {
        this.setState({ emailColNumber: value }, this.processImport)
    }

    beforeUpload(file: RcFile) {
        this.setState({file}, this.processImport)

        return false
    }

    async processImport(file?) {
        const raw = (file) ? file :this.state.file
        let data: any[] = []

        data = await this.parseMembersFromExcel(
            raw,
            this.state.firstNameColNumber - 1,
            this.state.lastNameColNumber - 1,
            this.state.emailColNumber - 1,
            this.state.fromLine - 1
        )

        if (!data || !data.length) {
            this.setState({
                file: null,
            })

            return message.error(i18n.t('error.file_format_unknown'))
        }

        this.setState({ data })
    }

    async parseMembersFromExcel(file: RcFile, nameColumnIndex: number, lastNameColumnIndex: number, emailColumnIndex: number, fromLine: number) {
        try {
            const workbook = await getSpreadsheetReaderForFile(file)

            const firstSheetName = workbook.SheetNames[0]
            if (!firstSheetName) throw new Error("The document does not contain a worksheet")
            const worksheet = workbook.Sheets[firstSheetName]
            if (!worksheet) throw new Error("The document does not contain a worksheet")
            const rangeMatches = worksheet["!ref"].match(/^([A-Z]+)([0-9]+):([A-Z]+)([0-9]+)$/)
            if (!rangeMatches) throw new Error("Invalid document range")

            const nameCol = this.colAdd(rangeMatches[1], nameColumnIndex)
            const lastNameCol = this.colAdd(rangeMatches[1], lastNameColumnIndex)
            const emailCol = this.colAdd(rangeMatches[1], emailColumnIndex)
            const startRow = parseInt(rangeMatches[2], 10) + fromLine
            const endRow = parseInt(rangeMatches[4], 10)

            const result: MemberImportData[] = []
            for (let i = startRow; i <= endRow; i++) {
                if (!worksheet[`${nameCol}${i}`] || !worksheet[`${emailCol}${i}`]) {
                    console.warn("Warning: Found empty values in row #" + i)
                    continue
                }
                else if (typeof worksheet[`${nameCol}${i}`].v !== "string" || typeof worksheet[`${emailCol}${i}`].v !== "string") {
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
            throw new Error("The spreadsheet file can't be processed")
        }
    }

    colAdd(column: string, amount = 1) {
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

            if (i === 0) {
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

    handleUpload(data) {
        this.setState({ uploading: true })

        const request = {
            membersInfo: data,
            method: "importMembers",
        }

        this.props.managerBackendGateway.sendRequest(request as any, this.props.web3Wallet.getWallet())
            .then((result) => {
                if (!result.ok) {
                    const error = i18n.t('cannot_import', {error: result.message})
                    message.error( error )
                    this.setState({ error })
                    return false
                }
                message.success("Members have been imported")
                Router.replace("/members#/" + this.state.address)
            },
            (error) => {
                let serverMessage = ''
                if (error.toString().includes('duplicate email')) {
                    serverMessage = i18n.t('duplicate_email')
                }
                const errorMessage = i18n.t('cannot_import', {error: serverMessage})
                message.error(errorMessage)
                console.error(error)
                this.setState({error})
            })
    }

    onRemoveUpload() {
        this.setState({
            data: [],
            file: null,
        })
    }

    downloadTemplateCsv() {
        const element = document.createElement("a")
        const data = "Name,Last Name,Email\nTestName,TestLastName,email@test.com"
        const file = new Blob([data], { type: 'text/csv;charset=utf-8' })
        element.href = URL.createObjectURL(file)
        element.download = "template.csv"
        document.body.appendChild(element)
        element.click()
    }

    render() {
        const columns = [
            { title: i18n.t('field.name'), dataIndex: 'firstName', key: 'firstName' },
            { title: i18n.t('field.last_name'), dataIndex: 'lastName', key: 'lastName' },
            { title: i18n.t('field.email'), dataIndex: 'email', key: 'email' }
        ]

        const layout = {
            xs: 24,
            lg: 12,
        }
        const columnLayout = {
            xs: 24,
        }
        // const inputColumnLayout = {
        //     xs: 24,
        //     xl: 8,
        //     // xxl: 6, // uncomment if we add more than 3 cols
        // }
        // const formLayout = {
        //     labelCol: {xs: 12, xl: 16},
        //     wrapperCol: {xs: 10, xl: 8},
        // }

        // const inputProps = {
        //     style: {
        //         width: '100%',
        //     }
        // }

        let files = []
        if (this.state.file) {
            files = [this.state.file]
        }

        return <div id="page-body">
            <div className="body-card">
                <Row gutter={24} justify="start">
                    <Col {...layout}>
                        <Row>
                            <Col {...columnLayout}>
                                <section>
                                    <Divider orientation="left">{i18n.t('members.import.title')}</Divider>
                                    <p>{i18n.t('members.import.description')}</p>
                                    {/* <p>You can add new members by creating a new CSV or updating the existing one (The system will skip the existing members and only add the new ones).</p> */}
                                    <p>{i18n.t('members.import.template')}</p>
                                    <Button
                                        onClick={() => this.downloadTemplateCsv()}
                                        type="ghost"
                                        icon={<DownloadOutlined />}
                                    >
                                        {i18n.t('members.btn.download_template')}
                                    </Button>
                                    <br /><br />
                                    <Dragger
                                        beforeUpload={(file) => this.beforeUpload(file)}
                                        onRemove={() => this.onRemoveUpload()}
                                        multiple={false}
                                        fileList={files}
                                    >
                                        <p className="ant-upload-text">
                                            <Ficon icon='FilePlus' /> {i18n.t('uploader.spreadsheets_note')}
                                        </p>
                                        <p className="ant-upload-hint">
                                            (csv, xls, xlsx, ods...)
                                        </p>
                                    </Dragger>
                                </section>
                            </Col>
                        </Row>

                        <DisabledLayer disabled={!(this.state.data && this.state.data.length)} text={i18n.t('members.import.select_file_first')}>
                            {/*   <Row>
                                <Col {...columnLayout}>
                                    <Divider orientation="left">Column selection</Divider>
                                    <p>Select the column number that corresponds to the following fields</p>

                                    <Row>
                                        <Col {...inputColumnLayout}>
                                            <Form.Item label="Name" required={true} {...formLayout}>
                                                <InputNumber
                                                    min={1} max={this.state.importedColumnsAmount}
                                                    value={this.state.firstNameColNumber}
                                                    onChange={ value => this.onChangeFirstNameColNumber(value) }
                                                    {...inputProps}
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col {...inputColumnLayout}>
                                            <Form.Item label="Last Name" required={true} {...formLayout}>
                                                <InputNumber min={1} max={this.state.importedColumnsAmount}
                                                    value={this.state.lastNameColNumber}
                                                    onChange={ value => this.onChangeLastNameColNumber(value) }
                                                    {...inputProps}
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col {...inputColumnLayout}>
                                            <Form.Item label="Email" required={true} {...formLayout}>
                                                <InputNumber min={1} max={this.state.importedColumnsAmount}
                                                    value={this.state.emailColNumber}
                                                    onChange={ value => this.onChangeEmailColNumber(value) }
                                                    {...inputProps}
                                                />
                                            </Form.Item>
                                        </Col>
                                    </Row>

                                    <Checkbox defaultChecked onChange={e => this.onChangeSkipFirstRow(e.target.checked)}>Skip the first row</Checkbox>
                                </Col>
                         </Row> */}

                            <Row>
                                <Col {...columnLayout}>
                                    <Divider orientation='left'>{i18n.t('members.import.confirm')}</Divider>
                                    <p>{i18n.t('members.import.confirm_note')}</p>
                                    <Button type='primary' size='large' onClick={() => this.handleUpload(this.state.data)}>
                                        {i18n.t('members.btn.import')}
                                    </Button>
                                </Col>
                            </Row>
                        </DisabledLayer>
                    </Col>
                    <Col {...layout}>
                        <Divider orientation='left'>{i18n.t('members.import.preview')}</Divider>
                        <Table
                            rowKey={(member: MemberImportData) => {
                                return `${member.email}-${member.lastName}`
                            }}
                            columns={columns}
                            dataSource={this.state.data}
                            loading={this.state.loading}
                        />
                        <DisabledLayer disabled={this.state.data?.length > 0}>
                            <Divider orientation='left'>{i18n.t('members.import.manual')}</Divider>
                            <MembersAddForm
                                {...this.props}
                                onSave={this.handleUpload.bind(this)}
                            />
                        </DisabledLayer>
                    </Col>
                </Row>
            </div>
        </div>
    }
}

export default MemberImportPage
