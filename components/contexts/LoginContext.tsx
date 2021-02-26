import { createContext } from 'react'

import { IWallet } from '../../lib/types'
import { IAppContext } from '../app-context'

export interface ILoginContext extends IAppContext {
    accountSelected: IWallet,
    accountSelect(account: string): void,
}

const LoginContext = createContext<ILoginContext>(null)

export default LoginContext
