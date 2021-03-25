import { Select } from 'antd'
import { AccountBackup } from 'dvote-js'
import React, { Component, ReactNode } from 'react'

import i18n from '../../../i18n'
import CreateAccountContext from '../../contexts/CreateAccountContext'
import Ficon from '../../ficon'

type OptionValue = {
    label: string,
    value: string,
}

type QuestionsState = {
    questions: OptionValue[],
}

type QuestionProps = {
    questions: OptionValue[],
    id: number,
}

class Question extends Component<QuestionProps, undefined> {
    static contextType = CreateAccountContext
    context !: React.ContextType<typeof CreateAccountContext>

    onChange(e: React.ChangeEvent<HTMLInputElement>) {
        const answer = e.target.value
        this.context.setBackupAnswers(this.props.id, {
            question: this.context.backupAnswers[this.props.id]?.question,
            answer,
        })
    }

    onSelect(question: any) : void {
        this.setState({question} as {question: string})
        this.context.setBackupAnswers(this.props.id, {
            question,
            answer: this.context.backupAnswers[this.props.id]?.answer,
        })
    }

    render() : ReactNode {
        const qna = this.context.backupAnswers[this.props.id]
        return (
            <div className='form-group'>
                <Select
                    className='w-full small'
                    dropdownClassName='reduced-select'
                    value={qna?.question}
                    onChange={this.onSelect.bind(this)}
                    placeholder={i18n.t('backup.select_question')}
                    options={this.props.questions}
                    loading={!this.props.questions.length}
                    dropdownMatchSelectWidth={true}
                />
                <input
                    className='form-control form-sm'
                    type='text'
                    onChange={this.onChange.bind(this)}
                    value={qna?.answer || ''}
                />
            </div>
        )
    }
}

export default class Questions extends Component<undefined, QuestionsState> {
    static contextType = CreateAccountContext
    context !: React.ContextType<typeof CreateAccountContext>

    state : QuestionsState = {
        questions: [],
    }

    componentDidMount() : void {
        const questions : OptionValue[] = []
        const keys = AccountBackup.questions()

        for (const id in keys) {
            questions.push({
                label: i18n.t(`backup:${keys[id]}`),
                value: id,
            })
        }
        this.setState({questions})
    }

    render() : ReactNode {
        let selected : string = null
        const valid = this.context.backupAnswers.every(({question, answer}) => {
            if (!selected) {
                // caution: this code will fail with more than two questions
                selected = question
            } else if (selected === question) {
                return false
            }

            if (!question?.length || !answer?.length) {
                return false
            }

            return true
        }) && this.context.backupAnswers.length > 1

        return <>
            <div className='flex justify-between items-center'>
                <button onClick={() => this.context.setStep('AskForBackup')}>
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
                    [0, 1].map((id) => (
                        <Question
                            id={id}
                            key={id}
                            questions={this.state.questions}
                        />
                    ))
                }
                <p className='text-xs'>
                    {i18n.t('backup.store_location')}
                </p>
                <div className='flex flex-row justify-between'>
                    <button
                        className='btn dark'
                        disabled={!valid}
                        onClick={() => this.context.setStep('Email')}
                    >
                        {i18n.t('btn.send_to_email')}
                    </button>
                    <button
                        className='btn dark'
                        disabled={!valid}
                        onClick={() => this.context.setStep('Download')}
                    >
                        {i18n.t('btn.download')}
                    </button>
                </div>
            </div>
        </>
    }
}
