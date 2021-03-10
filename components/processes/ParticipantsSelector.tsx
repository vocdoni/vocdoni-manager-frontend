import { Form, Input, message, Select, Upload } from 'antd'
import { RcFile } from 'antd/lib/upload'
import { str } from 'dot-object'
import React, { Component, ReactNode } from 'react'

import AppContext from '../../components/app-context'
import If from '../../components/if'
import { VotingFormImportData } from '../../lib/types'
import { parseSpreadsheetData } from '../../lib/import-utils'
import i18n from '../../i18n'
import Ficon from '../ficon'
import Spinner from "react-svg-spinner"

export type Census = {
    root: string,
    uri: string,
}

export type ParticipantsSelectorState = {
    selected: string,
    fileData: VotingFormImportData,
    selectedFile: RcFile,
    census: Census,
    processingFile: boolean
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
        processingFile: false
    }

    get options(): UnderlyingOptionValue[] {
        const options = [
            {
                label: i18n.t('process.field.participants_all'),
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
                        <Ficon icon='Download' /> {i18n.t('process.field.import_spreadsheet')}
                    </span>
                ) as unknown as string), // yes, seriously...
                value: 'file',
            },
            {
                label: ((
                    <span>
                        <Ficon icon='Download' /> {i18n.t('process.field.import_census')}
                    </span>
                ) as unknown as string), // yes, seriously...
                value: 'manual',
            },
        )

        return options
    }

    componentDidMount(): void {
        this.props.onChange(this.state.selected)
    }

    beforeUpload(file: RcFile): boolean {
        this.setState({ processingFile: true })
        this.processImport(file).then(() => {
            this.setState({ processingFile: false })
        })

        this.setState({ selectedFile: file })

        return false
    }

    processImport(file: RcFile): Promise<void> {
        return parseSpreadsheetData(this.context.address, file).then(fileData => {
            if (!fileData) {
                message.error(i18n.t('error.file_format_unknown'))
                return
            }

            this.setState({ fileData })

            this.props.onChange(this.state.selected, fileData)
        })
    }

    onChange(selected: string): void {
        this.setState({ selected })
        this.props.onChange(selected)
    }

    onFieldChange(field: string, { target: { value } }: React.ChangeEvent<HTMLInputElement>): void {
        this.setFieldValue(field, value)
    }

    setFieldValue(field: string, value: string): void {
        const state = { ...this.state }
        str(field, value, state)
        this.setState(state)

        this.props.onChange(this.state.selected, state.census)
    }

    renderLoading() {
        return <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
            {i18n.t('loading')} &nbsp;<Spinner />
        </div>
    }

    render(): ReactNode {
        const files = []
        if (this.state.selectedFile) {
            files.push(this.state.selectedFile)
        }

        return (
            <>
                <div className='label-wrapper'>
                    <label><Ficon icon='Users' /> {i18n.t('process.field.participants')}</label>
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
                            {i18n.t('process.field.import_spreadsheet_note')}
                        </small>
                        <If condition={this.state.processingFile}>
                            {this.renderLoading()}
                        </If>
                        <If condition={!this.state.processingFile}>
                            <Upload.Dragger
                                className='inline-uploader'
                                beforeUpload={this.beforeUpload.bind(this)}
                                fileList={files}
                                onRemove={() => this.setState({
                                    selectedFile: null,
                                    fileData: null,
                                })}
                            >
                                <p className="ant-upload-text">
                                    <Ficon icon='FilePlus' /> {i18n.t('uploader.spreadsheets_note')}
                                </p>
                                <p className="ant-upload-hint">
                                    (csv, xls, xlsx, ods...)
                            </p>
                            </Upload.Dragger>
                        </If>
                    </div>
                </If>
                <If condition={this.state.selected === 'manual'}>
                    <div>
                        <small>
                            {i18n.t('process.field.import_census_note')}
                        </small>
                        <Form.Item label={i18n.t('process.field.census_root')}>
                            <Input
                                placeholder='0x038f1d41d1c...'
                                onChange={this.onFieldChange.bind(this, 'census.root')}
                                value={this.state.census.root}
                            />
                        </Form.Item>
                        <Form.Item label={i18n.t('process.field.census_uri')}>
                            <Input
                                placeholder={i18n.t('process.field.census_uri_note')}
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
