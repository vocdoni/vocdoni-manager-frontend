import { Button, Divider, message, Radio } from 'antd'
import { ProcessMetadata } from 'dvote-js'
import React, { Component, ReactNode } from 'react'
// hardcoded to cat for now
import main from '../../i18n/ca'
import { areAllNumbers } from '../../lib/util'

// harcoding style
import styles from '../vote.module.css'

type Props = {
    process: ProcessMetadata,
    onSubmitClick: (values: number[]) => void,
    onOptionChange?: (questionId: number, value: any) => void
}

type State = {
    choices: number[],
}

const radioStyle = {
    display: 'block',
    height: '30px',
    lineHeight: '30px',
}

export default class Questions extends Component<Props, State> {
    state = {
        choices: [],
    }

    setQuestionChoice(questionIdx: number, choiceValue: number) : void {
        if (typeof choiceValue == 'string') {
            choiceValue = parseInt(choiceValue, 10)
        }

        if (isNaN(choiceValue)) {
            message.warn(main.invalidQuestionOptionValue)
            return
        }

        const choices = [...this.state.choices]
        choices[questionIdx] = choiceValue

        this.setState({ choices })
    }

    render() : ReactNode {
        const { process } = this.props
        const { choices } = this.state
        const allQuestionsChosen = areAllNumbers(this.state.choices) && choices.length == process.details.questions.length

        return <>
            <h2>{main.selectQuestionsTitle}</h2>
            {
                process.details.questions.map((question, questionIdx) => <div key={questionIdx} className='stage2'>
                    <Divider />
                    <h4>{question.question.default}</h4>
                    <div
                        className='process-question-description'
                        dangerouslySetInnerHTML={{__html: question.description.default}}
                    />
                    <Radio.Group
                        size='large'
                        onChange={ev => this.setQuestionChoice(questionIdx, ev.target.value)}
                        value={this.state.choices[questionIdx]}
                    >
                        {
                            question.voteOptions.map((option, i) => (
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
                    className={styles.btn}
                    onClick={() => this.props.onSubmitClick(choices)}
                >
                    {main.confirmSelection}
                </Button>
            </div>
        </>
    }
}
