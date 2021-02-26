import { CheckboxChangeEvent } from 'antd/lib/checkbox'
import { ChangeEvent, createContext } from 'react'

import { IAppContext } from '../app-context'

export interface ICreateAccountContext extends IAppContext {
    name: string,
    setName?(e: ChangeEvent<HTMLInputElement>): void,
    terms: boolean,
    setTerms?(e: CheckboxChangeEvent): void,
    password: string,
    setPassword?(e: ChangeEvent<HTMLInputElement>): void,
    step: string,
    setStep?(step: string): void,
    createAccount?(name: string, password: string): void,
}

const CreateAccountContext = createContext<ICreateAccountContext>(null)

export default CreateAccountContext
