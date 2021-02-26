import { Select } from 'antd'
import React, { Component, ReactNode } from 'react'

import i18n from '../../../i18n'
import qfile from '../../../lib/common/backup/questions.spec.json'
import CreateAccountContext from '../../contexts/CreateAccountContext'
import Ficon from '../../ficon'

type OptionValue = {
    label: string,
    value: string,
}

type QuestionAnswer = {
    question: string,
    answer: string,
}

type QuestionsState = {
    questions: OptionValue[],
    selections: QuestionState[],
}

type QuestionProps = {
    questions: OptionValue[],
    onChange(question: string, answer: string) : void,
}

type QuestionState = {
    question: string | null,
    answer: string,
}

class Question extends Component<QuestionState, QuestionProps> {
    state : QuestionState = {
        question: null,
        answer: '',
    }

    onChange(e: React.ChangeEvent<HTMLInputElement>) {
        const answer = e.target.value
        this.setState({answer})
        this.props.onChange(this.state.question, answer)
    }

    onSelect(question: any) : void {
        this.setState({question})
        this.props.onChange(question, this.state.answer)
    }

    render() : ReactNode {
        return (
            <div className='form-group'>
                <Select
                    className='w-full small'
                    dropdownClassName='reduced-select'
                    value={this.state.question}
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
                    value={this.state.answer}
                />
            </div>
        )
    }
}

export default class Questions extends Component<undefined, undefined> {
    static contextType = CreateAccountContext
    context !: React.ContextType<typeof CreateAccountContext>

    state : QuestionsState = {
        questions: [],
        selections: [],
    }

    setSelection(num: number, question: string, answer: string) : void {
        const state : QuestionState = {
            question,
            answer,
        }

        const selections = [...this.state.selections]
        selections[num] = state

        this.setState({selections})
    }

    componentDidMount() : void {
        const questions : OptionValue[] = []
        const keys = Object.values(qfile.versions[process.env.BACKUP_LINK_VERSION].questions)
        for (const question of keys) {
            questions.push({
                label: i18n.t(`backup:${question}`),
                value: question,
            })
        }
        this.setState({questions})
    }

    render() : ReactNode {
        let selected : string = null
        const valid = this.state.selections.every(({question, answer}) => {
            if (!selected) {
                // caution: this code will fail with more than two questions
                selected = question
            } else if (selected === question) {
                return false
            }

            if (!question.length || !answer.length) {
                return false
            }

            return true
        }) && this.state.selections.length > 1

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
                <Question
                    questions={this.state.questions}
                    onChange={this.setSelection.bind(this, 0)}
                />
                <Question
                    questions={this.state.questions}
                    onChange={this.setSelection.bind(this, 1)}
                />
                <p className='text-xs'>
                    {i18n.t('backup.store_location')}
                </p>
                <div className='flex flex-row justify-between'>
                    <button className='btn dark' disabled={!valid}>
                        {i18n.t('btn.send_to_email')}
                    </button>
                    <button className='btn dark' disabled={!valid}>
                        {i18n.t('btn.download')}
                    </button>
                </div>
            </div>
        </>
    }
}
