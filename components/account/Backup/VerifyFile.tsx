import { message, Upload } from 'antd'
import { RcFile } from 'antd/lib/upload'
import { AccountBackup, AccountBackupModel, deserializeBackupLink } from 'dvote-js'
import Link from 'next/link'
import React, { Component, ReactNode } from 'react'

import i18n from '../../../i18n'
import { FileReaderPromise } from '../../../lib/file-utils'
import CreateAccountContext from '../../contexts/CreateAccountContext'
import Ficon from '../../ficon'

type State = {
    file: RcFile,
}

export default class VerifyFile extends Component<undefined, State> {
    static contextType = CreateAccountContext
    context !: React.ContextType<typeof CreateAccountContext>

    state : State = {
        file: null,
    }

    async onBeforeUpload(file: RcFile) : void {
        this.setState({file})


        const contents = await FileReaderPromise(file)
        let deserialized : AccountBackupModel
        try {
            deserialized = AccountBackup.deserialize(contents)
        } catch (e) {
            message.error(i18n.t('error.invalid_format_contents'))
            return
        }

        this.context.setName(deserialized.alias)
        const qspec = AccountBackup.questions()
        const questions = {}
        deserialized.questions.forEach((id) => {
            questions[id] = i18n.t(`backup:${qspec[id]}`)
        })
        this.context.setBackupQuestions(questions)

        this.context.setStep('RecoveryForm')
    }

    render() : ReactNode {
        const files = []
        if (this.state.file) {
            files.push(this.state.file)
        }

        return <>
            <h5 className='text-center text-lg font-normal text-gray-500 flex-1'>
                {i18n.t('backup.verify')}
            </h5>
            <div className='spaced-content'>
                <p>{i18n.t('backup.verify_file_description')}</p>
                <Upload.Dragger
                    beforeUpload={this.onBeforeUpload.bind(this)}
                    fileList={files}
                    accept={'.bak'}
                >
                    <p className="ant-upload-text">
                        <Ficon icon='FilePlus' /> {i18n.t('drag_and_drop_or_click')}
                    </p>
                    <p className="ant-upload-hint">
                        (bak)
                    </p>
                </Upload.Dragger>
            </div>
            <div className='flex flex-row justify-between'>
                <Link href='/entities/new'>
                    <a className='btn'>
                        {i18n.t('do_it_later')}
                    </a>
                </Link>
            </div>
        </>
    }
}
