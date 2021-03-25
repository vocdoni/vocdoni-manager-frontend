import { CheckboxChangeEvent } from 'antd/lib/checkbox'
import { createContext } from 'react'

import { QuestionAnswer } from '../../lib/types'
import { IAppContext } from '../app-context'

export interface ICreateAccountContext extends IAppContext {
    backupAnswers: QuestionAnswer[],
    createAccount?(name: string, password: string): void,
    getBackup(): Uint8Array,
    name: string,
    password: string,
    questions: {[key: number]: string},
    seed: string,
    setBackupAnswers?(position: number, qa: QuestionAnswer): void,
    setBackupQuestions?(questions: {[key: number]: string}),
    setName?(name: string): void,
    setPassword?(password: string): void,
    setStep?(step: string): void,
    setTerms?(e: CheckboxChangeEvent): void,
    step: string,
    terms: boolean,
}

const CreateAccountContext = createContext<ICreateAccountContext>(null)

export default CreateAccountContext
