import { Button, Divider, message, Radio } from 'antd'
import { ProcessMetadata } from 'dvote-js'
import React, { Component, ReactNode } from 'react'
// hardcoded to cat for now
import { main } from '../../i18n'
import { areAllNumbers, toArray } from '../../lib/util'

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
            message.warn(main.invalidQuestionOptionValue)
            return
        }

        const choices = {...this.state.choices}
        choices[questionIdx] = choiceValue

        this.setState({ choices })
    }

    render() : ReactNode {
        const { process } = this.props
        const { choices } = this.state
        const allQuestionsChosen = areAllNumbers(this.state.choices) && Object.values(choices).length === process.details.questions.length

        return <>
            <Divider />
            <h2>{main.selectQuestionsTitle}</h2>
            {
                process.details.questions.map((question, questionIdx) => <div key={questionIdx} className='vote-questions'>
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
                    onClick={() => this.props.onSubmitClick(toArray(choices))}
                >
                    {main.confirmSelection}
                </Button>
            </div>
        </>
    }
}
