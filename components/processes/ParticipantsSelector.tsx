import { Alert, message, Select, Upload } from 'antd'
import { RcFile } from 'antd/lib/upload'
import React, { Component, ReactNode } from 'react'
import {
    Download,
    FilePlus,
    Users,
} from 'react-feather'

import AppContext from '../../components/app-context'
import If from '../../components/if'
import { VotingFormImportData } from '../../lib/types'
import { parseSpreadsheetData } from '../../lib/import-utils'

export type ParticipantsSelectorState = {
    selected: string,
    fileData: VotingFormImportData,
    selectedFile: RcFile,
}

export type ParticipantsSelectorProps = {
    loading: boolean,
    options: OptionValue[],
    onChange: (selected: string, fileData?: VotingFormImportData) => void,
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

        options.push({
            label: ((
                <span>
                    <Download /> From spreadsheet (Attribute auth.)
                </span>
            ) as unknown as string), // yes, seriously...
            value: 'file',
        })

        return options
    }

    componentDidMount() {
        this.props.onChange(this.state.selected)
    }

    beforeUpload(file: RcFile) : boolean {
        this.processImport(file)

        this.setState({selectedFile: file})

        return false
    }

    async processImport(file: RcFile) : Promise<void> {
        const fileData : VotingFormImportData = await parseSpreadsheetData(this.context.entityId, file)

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

    render() : ReactNode {
        const files = []
        if (this.state.selectedFile) {
            files.push(this.state.selectedFile)
        }

        return (
            <>
                <div className='label-wrapper'>
                    <label><Users /> Participants</label>
                    <Select
                        dropdownClassName='reduced-select'
                        value={this.state.selected}
                        onChange={this.onChange.bind(this)}
                        options={this.options}
                        loading={this.props.loading}
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
                                <FilePlus /> Drag &amp; drop ot click to browse files (csv, xls, xlsx, ods...)
                            </p>
                        </Upload.Dragger>
                    </div>
                </If>
            </>
        )
    }
}
