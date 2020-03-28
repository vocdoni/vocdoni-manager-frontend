import { providers } from "ethers"

let provider: providers.Web3Provider = null

export enum AccountState {
    Unknown = "Unknown",
    NoWeb3 = "Web3 is not detected on your browser",
    NoEthereum = "Ethereum is not detected on your browser",
    Locked = "Account is locked",
    Ok = "Ok"
}

export default class Web3Wallet {
    static get provider() { return provider }
    static get signer() { return provider.getSigner() }

    static isAvailable() {
        return Web3Wallet.isWeb3Available() && Web3Wallet.isEthereumAvailable()
    }

    static isWeb3Available() {
        return typeof window["web3"] !== 'undefined'
    }

    static isEthereumAvailable() {
        return typeof window["ethereum"] !== 'undefined'
    }

    static connect() {
        if (provider != null) provider.polling = false
        provider = new providers.Web3Provider(window["web3"].currentProvider)
    }

    public static unlock(): Promise<void> {
        if (!provider) this.connect()
        return window["ethereum"].enable()
    }

    public static getAccountState(): Promise<AccountState> {
        if (!Web3Wallet.isWeb3Available()) return Promise.resolve(AccountState.NoWeb3)
        else if (!Web3Wallet.isEthereumAvailable()) return Promise.resolve(AccountState.NoEthereum)
        else if (!provider) return Promise.resolve(AccountState.Locked)

        return provider.listAccounts()
            .then(accounts => {
                if (accounts && accounts[0]) return AccountState.Ok
                else return AccountState.Locked
            })
    }

    public static getAddress(): Promise<string> {
        if (!provider) this.connect()
        return provider.getSigner().getAddress()
    }

    public static getNetworkName(): string {
        if (!Web3Wallet.isAvailable()) return ""
        
        if (!provider) this.connect()
        return provider.network.name
    }
}
