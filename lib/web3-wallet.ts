import { Wallet, utils, providers, BigNumber } from "ethers"
import { WalletUtil } from 'dvote-js'
import { DataCache } from "./storage"
import { Key } from "react"
import { IWallet } from "./types"
import { makeUid } from "./util"

let web3Wallet: Web3Wallet

export function getWeb3Wallet() {
    if (!web3Wallet) web3Wallet = new Web3Wallet()
    return web3Wallet
}

export default class Web3Wallet {
    private wallet: Wallet
    private provider: providers.Provider
    private walletAddress: string
    private db: DataCache;

    constructor() {
        if (process.browser) this.db = new DataCache()
    }

    public getWallet(): Wallet {
        return this.wallet
    }

    public setWallet(newWallet: Wallet) {
        this.wallet = newWallet
    }

    public setProvider(provider: providers.Provider): void {
        this.provider = provider
    }

    public getProvider(): providers.Provider {
        return this.provider
    }

    public connect(newProvider: providers.Provider) {
        this.setProvider(newProvider)
        if (this.hasWallet()) {
            this.wallet = this.wallet.connect(newProvider)
        }
        return this.wallet
    }

    // Generates a wallet and stores it on IndexedDB
    public store(name: string, seed: string, passphrase: string): Promise<Key> {
        const wallet = WalletUtil.fromSeededPassphrase(passphrase, seed)
        // tslint:disable-next-line
        return this.db.addWallet({
            name,
            seed,
            publicKey: wallet._signingKey().publicKey,
            uid: makeUid(),
        });
    }

    public getPublicKey(): string {
        return this.wallet._signingKey().publicKey
    }

    // Gets all the stored wallet accounts from IndexedDB
    public getStored(): Promise<IWallet[]>  {
        return this.db.getAllWallets();
    }

    public getStoredWallet(publicKey: string) : Promise<IWallet> {
        return this.db.wallets.get({publicKey})
    }

    public updateStored(name: string, data: any) : Promise<number> {
        // @ts-expect-error due to dixie expecting a number, although it properly works with key strings
        return this.db.wallets.update(name, data)
    }

    // Loads a wallet form IndexedDB if the provided passphrase is correct
    public async load(name: string, passphrase: string): Promise<boolean> {
        const storedWallet = await this.db.getWallet(name)

        const wallet = WalletUtil.fromSeededPassphrase(passphrase, storedWallet.seed)
        this.walletAddress = await wallet.getAddress()

        // We need to verify the generated wallet publicKey = stored public Key
        // tslint:disable-next-line
        if (wallet._signingKey().publicKey === storedWallet.publicKey) {
            this.wallet = wallet
        } else {
            throw new Error('Wrong password for wallet!')
        }

        return true
    }

    public hasWallet(): boolean {
        return !!this.wallet
    }

    public getAddress(): string {
        if (!this.hasWallet) throw new Error('Wallet not available')

        return this.walletAddress
    }

    public async getBalance(): Promise<string> {
        const balance: BigNumber = await this.provider.getBalance(await this.wallet.getAddress())
        return balance.toString()
    }

    public async getEthBalance(): Promise<string> {
        const balance: BigNumber = await this.provider.getBalance(await this.wallet.getAddress())

        return utils.formatEther(balance)
    }

    public async waitForGas(): Promise<boolean> {
        if (!this.hasWallet) throw new Error('Wallet not available')

        console.log('Waiting to get some gas to: ', await this.wallet.getAddress())

        let counter = 1
        while (true) {
            if (counter > 50) return false

            if (+(await this.getBalance()) > 0) {
                return true
            }

            await new Promise(r => setTimeout(r, 5000)) // Sleeps for 5 seconds
            counter += 1
        }
    }
}
