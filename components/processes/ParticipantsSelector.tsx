import { Form, Input, message, Select, Upload } from 'antd'
import { RcFile } from 'antd/lib/upload'
import { str } from 'dot-object'
import React, { Component, ReactNode } from 'react'

import AppContext from '../../components/app-context'
import If from '../../components/if'
import { VotingFormImportData } from '../../lib/types'
import { parseSpreadsheetData } from '../../lib/import-utils'
import Ficon from '../ficon'

export type Census = {
    root: string,
    uri: string,
}

export type ParticipantsSelectorState = {
    selected: string,
    fileData: VotingFormImportData,
    selectedFile: RcFile,
    census: Census,
}

export type ParticipantsSelectorProps = {
    loading: boolean,
    options: OptionValue[],
    onChange: (selected: string, data?: VotingFormImportData | Census) => void,
}

type OptionValue = {
    label: ReactNode,
    value: string,
}

type UnderlyingOptionValue = {
    label: string,
    value: string,
}

export default class ParticipantsSelector extends Component<ParticipantsSelectorProps, ParticipantsSelectorState> {
    static contextType = AppContext
    context!: React.ContextType<typeof AppContext>

    state: ParticipantsSelectorState = {
        selected: 'all',
        fileData: null,
        selectedFile: null,
        census: {
            root: null,
            uri: null,
        },
    }

    get options() : UnderlyingOptionValue[] {
        const options = [
            {
                label: 'All members',
                value: 'all',
            }
        ]

        options.push(...(
            this.props.options as unknown as UnderlyingOptionValue[]
        ))

        options.push(
            {
                label: ((
                    <span>
                        <Ficon icon='Download' /> From spreadsheet (Attribute auth.)
                    </span>
                ) as unknown as string), // yes, seriously...
                value: 'file',
            },
            {
                label: ((
                    <span>
                        <Ficon icon='Download' /> Import census
                    </span>
                ) as unknown as string), // yes, seriously...
                value: 'manual',
            },
        )

        return options
    }

    componentDidMount() : void {
        this.props.onChange(this.state.selected)
    }

    beforeUpload(file: RcFile) : boolean {
        this.processImport(file)

        this.setState({selectedFile: file})

        return false
    }

    async processImport(file: RcFile) : Promise<void> {
        const fileData : VotingFormImportData = await parseSpreadsheetData(this.context.address, file)

        if (!fileData) {
            message.error('Unknown file format uploaded')
            return
        }

        this.setState({fileData})

        this.props.onChange(this.state.selected, fileData)
    }

    onChange(selected: string) : void {
        this.setState({selected})
        this.props.onChange(selected)
    }

    onFieldChange(field: string, {target: {value}}: React.ChangeEvent<HTMLInputElement>) : void {
        this.setFieldValue(field, value)
    }

    setFieldValue(field: string, value: string) : void {
        const state = {...this.state}
        str(field, value, state)
        this.setState(state)

        this.props.onChange(this.state.selected, state.census)
    }

    render() : ReactNode {
        const files = []
        if (this.state.selectedFile) {
            files.push(this.state.selectedFile)
        }

        return (
            <>
                <div className='label-wrapper'>
                    <label><Ficon icon='Users' /> Participants</label>
                    <Select
                        dropdownClassName='reduced-select'
                        value={this.state.selected}
                        onChange={this.onChange.bind(this)}
                        options={this.options}
                        loading={this.props.loading}
                        dropdownMatchSelectWidth={false}
                    />
                </div>
                <If condition={this.state.selected === 'file'}>
                    <div>
                        <small>
                            Voters will be authenticated completing a form with the
                            attributes of the spreadsheet. This method does not allow
                            to use the App to vote. The spreadsheet file is never
                            uploaded and only a fingerprint of the user attributes is
                            used for the authentication.
                        </small>
                        <Upload.Dragger
                            className='inline-uploader'
                            beforeUpload={this.beforeUpload.bind(this)}
                            fileList={files}
                            onRemove={() => this.setState({
                                selectedFile: null,
                                fileData: null,
                            })}
                        >
                            <p>
                                <Ficon icon='FilePlus' /> Drag &amp; drop ot click to browse files (csv, xls, xlsx, ods...)
                            </p>
                        </Upload.Dragger>
                    </div>
                </If>
                <If condition={this.state.selected === 'manual'}>
                    <div>
                        <small>
                            Manually set the census root and uri (for CA voting, won't
                            send e-mails nor other automated processes)
                        </small>
                        <Form.Item label='Census Root'>
                            <Input
                                placeholder='0x038f1d41d1c...'
                                onChange={this.onFieldChange.bind(this, 'census.root')}
                                value={this.state.census.root}
                            />
                        </Form.Item>
                        <Form.Item label='Census Uri'>
                            <Input
                                placeholder='Either a merkle tree uri or another CA endpoint url'
                                onChange={this.onFieldChange.bind(this, 'census.uri')}
                                value={this.state.census.uri}
                            />
                        </Form.Item>
                    </div>
                </If>
            </>
        )
    }
}
