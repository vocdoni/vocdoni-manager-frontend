import { providers } from "ethers"

let provider: providers.Web3Provider = null;

export enum AccountState {
    Unknown = "Unknown",
    NoWeb3 = "Web3 is not detected in the browser",
    NoEthereum = "Ethereum is not detected in the browser",
    Locked = "Account is locked",
    Ok = "Ok"
}

export default class Web3Manager {
    static get provider() { return provider };
    static get signer() { return provider.getSigner() };

    static isWeb3Available() {
        return typeof window["web3"] !== 'undefined';
    }

    static isEthereumAvailable() {
        return typeof window["ethereum"] !== 'undefined';
    }

    static connect() {
        if (provider != null) provider.polling = false;
        provider = new providers.Web3Provider(window["web3"].currentProvider);
    }

    public static unlock() {
        if (!provider) this.connect();
        window["ethereum"].enable();
    }

    public static getAccountState(): Promise<AccountState> {
        return new Promise((resolve, reject) => {
            if (!Web3Manager.isWeb3Available()) return resolve(AccountState.NoWeb3)
            else if (!Web3Manager.isEthereumAvailable()) return resolve(AccountState.NoEthereum)
            else if (!provider) return resolve(AccountState.Locked)
            provider.listAccounts()
                .then(accounts => {
                    if (accounts && accounts[0]) return resolve(AccountState.Ok);
                    else return resolve(AccountState.Locked);
                })
                .catch(err => reject(err))
        })
    }

    public static getAddress(): Promise<string> {
        if (!provider) this.connect();
        return provider.getSigner().getAddress();
    }
}
