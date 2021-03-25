import moment from 'moment'
import React, { Component, ReactNode } from 'react'

import i18n from '../../../i18n'
import { downloadFileWithContents } from '../../../lib/util'
import CreateAccountContext from '../../contexts/CreateAccountContext'
import Ficon from '../../ficon'

export default class Download extends Component {
    static contextType = CreateAccountContext
    context !: React.ContextType<typeof CreateAccountContext>

    download() : void {
        const date = moment().format('YYYY-MM-DD')
        const name = this.context.name.replace(/[\\/:"*?<>|]+/g, '').replace(' ', '-')
        downloadFileWithContents(this.context.getBackup(), {
            filename: `vocdoni-backup-${name}-${date}.bak`,
            mime: 'application/octet-stream',
        })
    }

    componentDidMount() : void {
        this.download()
    }

    render() : ReactNode {
        return <>
            <div className='flex justify-between items-center'>
                <button onClick={() => this.context.setStep('Questions')}>
                    <Ficon icon='ArrowLeft' />
                </button>
                <h5 className='text-center text-lg font-normal text-gray-500 flex-1'>
                    {i18n.t('backup.title')}
                </h5>
            </div>
            <div className='spaced-content'>
                <p>
                    {i18n.t('backup.download_description')}
                </p>
            </div>
            <div className='flex flex-row justify-between'>
                <button className='btn' onClick={this.download.bind(this)}>
                    {i18n.t('btn.retry_download')}
                </button>
                <button className='btn primary' onClick={() => this.context.setStep('VerifyFile')}>
                    {i18n.t('next')}
                </button>
            </div>
        </>
    }
}

