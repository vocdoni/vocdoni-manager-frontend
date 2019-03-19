import Web3 from 'web3'
import { AccountState } from './accountState';
declare var web3: any; //this represents the window.web3
declare var ethereum: any; //this represents the window.ethereum

export default class Web3Manager {

    static readonly Web3 = Web3;

    static browserHasWeb3 = (): boolean => {
        if (typeof web3 !== 'undefined') {
            return true
        } else {
            return false
        }
    }

    static browserHasEthereum = (): boolean => {
        if (typeof ethereum !== 'undefined') {
            return true
        } else {
            return false
        }
    }

    public static getBrowserAccountState = (): Promise<AccountState> => {
        return new Promise((resolve, reject) => {

            if (!Web3Manager.browserHasWeb3()) {
                resolve(AccountState.NoWeb3)
            }

            if (!Web3Manager.browserHasEthereum()) {
                resolve(AccountState.NoEthereum)
            }

            web3.eth.getAccounts(function (err, accounts) {

                if (err != null) {
                    reject(err)
                }

                if (accounts[0])
                    resolve(AccountState.Ok)
                else
                    resolve(AccountState.NoUnlocked)
            });
        })
    }

    public static unlock() {
        ethereum.enable()
    }

    public static getAccount = (): Promise<string> => {
        return new Promise((resolve, reject) => {
            web3.eth.getAccounts(function (err, accounts) {
                if (err != null)
                    reject(err)
                resolve(accounts[0])
            });
        })
    }
    
    public static getNetworkId = (): Promise<number> => {
        return new Promise((resolve, reject) => {
            web3.version.getNetwork((err, netId) => {
                if (err)
                    reject(err)
                resolve(netId)
            })
        })
    }

    public static getNetworkName = (networkId: number) => {
        switch (networkId) {
            case 1:
                return ('Mainet')
                break
            case 2:
                return ('Morden')
                break
            case 3:
                return ('Ropsten')
                break
            case 1714:
                return ('Vocdoni testnet')
                break
            default:
                return ('Unknown')
        }
    }

    public static getInjectedProvider = () => {
        return web3.currentProvider
    }

}