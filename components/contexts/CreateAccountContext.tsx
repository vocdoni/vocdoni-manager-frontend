import { CheckboxChangeEvent } from 'antd/lib/checkbox'
import { ChangeEvent, createContext } from 'react'

import { QuestionAnswer } from '../../lib/types'
import { IAppContext } from '../app-context'

export interface ICreateAccountContext extends IAppContext {
    name: string,
    setName?(e: ChangeEvent<HTMLInputElement>): void,
    terms: boolean,
    setTerms?(e: CheckboxChangeEvent): void,
    password: string,
    setPassword?(password: string): void,
    seed: string,
    step: string,
    setStep?(step: string): void,
    createAccount?(name: string, password: string): void,
    backupAnswers: QuestionAnswer[],
    setBackupAnswers?(position: number, qa: QuestionAnswer) : void,
    getBackupLink() : string,
}

const CreateAccountContext = createContext<ICreateAccountContext>(null)

export default CreateAccountContext
