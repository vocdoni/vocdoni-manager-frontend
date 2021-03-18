import React, { Component, ReactNode } from 'react'

import i18n from '../../../i18n'
import qfile from '../../../lib/common/backup/questions.spec.json'
import AppContext from '../../app-context'
import Ficon from '../../ficon'

export default class Recovery extends Component<undefined, undefined> {
    static contextType = AppContext
    context !: React.ContextType<typeof AppContext>

    componentDidMount() : void {
        const spec = qfile.versions[process.env.BACKUP_LINK_VERSION]
    }

    render() : ReactNode {
        return <>
            <div className='flex justify-between items-center'>
                <button>
                    <Ficon icon='ArrowLeft' />
                </button>
                <h5 className='text-center text-lg font-normal text-gray-500 flex-1'>
                    {i18n.t('backup.title')}
                </h5>
            </div>
            <div className='spaced-content'>
                <p>{i18n.t('backup.select_questions')}</p>
                <p>{i18n.t('backup.encrypt_with_password')}</p>
                {
                    // [0, 1].map((id) => (
                    //     <Question
                    //         id={id}
                    //         key={id}
                    //         questions={this.state.questions}
                    //     />
                    // ))
                }
                <p className='text-xs'>
                    {i18n.t('backup.store_location')}
                </p>
                <div className='flex flex-row justify-between'>
                    <button
                        className='btn dark'
                    >
                        {i18n.t('btn.send_to_email')}
                    </button>
                    <button
                        className='btn dark'
                    >
                        {i18n.t('btn.download')}
                    </button>
                </div>
            </div>
        </>
    }
}
