import { Button, Divider, message, Radio } from 'antd'
import { ProcessMetadata } from 'dvote-js'
import React, { Component, ReactNode } from 'react'

import { areAllNumbers, toArray } from '../../lib/util'
import i18n from '../../i18n'

type Props = {
    process: ProcessMetadata,
    onSubmitClick: (values: number[]) => void,
    onOptionChange?: (questionId: number, value: any) => void
    choices: number[],
}

type State = {
    choices: {
        [key: number]: number,
    },
}

const radioStyle = {
    display: 'block',
    height: '30px',
    lineHeight: '30px',
}

export default class Questions extends Component<Props, State> {
    state = {
        choices: {},
    }

    componentDidMount() : void {
        if (this.props.choices) {
            this.setState({choices: this.props.choices})
        }
    }

    setQuestionChoice(questionIdx: number, choiceValue: number) : void {
        if (typeof choiceValue == 'string') {
            choiceValue = parseInt(choiceValue, 10)
        }

        if (isNaN(choiceValue)) {
            message.warn(i18n.t('process.error.wrong_value'))
            return
        }

        const choices = {...this.state.choices}
        choices[questionIdx] = choiceValue

        this.setState({ choices })
    }

    render() : ReactNode {
        const { process } = this.props
        const { choices } = this.state
        const allQuestionsChosen = areAllNumbers(this.state.choices) && Object.values(choices).length === process.questions.length

        return <>
            <Divider />
            <h2>{i18n.t('process.voting')}</h2>
            {
                process.questions.map((question, questionIdx) => <div key={questionIdx} className='vote-questions'>
                    <Divider />
                    <h4>{question.title.default}</h4>
                    <div
                        className='process-question-description styled-content'
                        dangerouslySetInnerHTML={{__html: question.description.default}}
                    />
                    <Radio.Group
                        size='large'
                        onChange={ev => this.setQuestionChoice(questionIdx, ev.target.value)}
                        value={this.state.choices[questionIdx]}
                    >
                        {
                            question.choices.map((option, i) => (
                                <Radio
                                    key={i}
                                    style={radioStyle}
                                    value={option.value}
                                >
                                    {option.title.default}
                                </Radio>
                            ))
                        }
                    </Radio.Group>
                </div>)
            }

            <Divider />

            <div className='bottom-button-wrapper'>
                <Button
                    type='primary'
                    size={'large'}
                    disabled={!allQuestionsChosen}
                    onClick={() => this.props.onSubmitClick(toArray(choices))}
                >
                    {i18n.t('process.btn.confirm')}
                </Button>
            </div>
        </>
    }
}
