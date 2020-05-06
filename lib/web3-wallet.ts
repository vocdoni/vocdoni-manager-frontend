import { Wallet } from "ethers"
import { Provider } from "ethers/providers"
import { EtherUtils } from "dvote-js"
import { DataCache } from "./storage"
import { Key } from "react"
import { IWallet } from "./types"
import { BigNumber } from "ethers/utils"

let web3Wallet: Web3Wallet

export function getWeb3Wallet() {
  if (!web3Wallet) web3Wallet = new Web3Wallet()
  return web3Wallet
}

export default class Web3Wallet {
    private wallet: Wallet
    private provider: Provider
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

    public setProvider(provider: Provider): void {
      this.provider = provider
    }

    public getProvider(): Provider {
      return this.provider
    }

    public connect(newProvider: Provider) {
      this.setProvider(newProvider)
      if (this.hasWallet()) {
        this.wallet = this.wallet.connect(newProvider)
      }
      return this.wallet
    }

    // Generates a wallet and stores it on IndexedDB
    public store(name: string, seed: string, passphrase: string): Promise<Key> {
      const wallet = EtherUtils.Signers.walletFromSeededPassphrase(passphrase, seed)
      return this.db.addWallet({ name, seed, publicKey: wallet["signingKey"].publicKey });
    }

    // Gets all the stored wallet accounts from IndexedDB
    public getStored(): Promise<Array<IWallet>>  {
      return this.db.getAllWallets();
    }

    // Loads a wallet form IndexedDB if the provided passphrase is correct
    public async load(name: string, passphrase: string): Promise<boolean> {
      const storedWallet = await this.db.getWallet(name)

      const wallet = EtherUtils.Signers.walletFromSeededPassphrase(passphrase, storedWallet.seed)
      this.walletAddress = await wallet.getAddress()

      // We need to verify the generated wallet publicKey = stored public Key
      if(wallet["signingKey"].publicKey === storedWallet.publicKey){
        this.wallet = wallet
      } else {
        throw new Error('Wrong passphrase for wallet!')
      }

      return true
    }

    public hasWallet(): boolean {
      return !!this.wallet
    }

    public getAddress(): string {
      if(!this.hasWallet) throw new Error('Wallet not available')

      return this.walletAddress
    }

    public async getBalance(): Promise<string> {
      const balance: BigNumber = await this.provider.getBalance(await this.wallet.getAddress())
      return balance.toString()
    }

    
    public async waitForGas(): Promise<boolean> {
      if(!this.hasWallet) throw new Error('Wallet not available')
      
      console.log('Trying to get some gas to: ', await this.wallet.getAddress())

      //
      // TODO: Sends some ETH to the active wallet
      //

      let counter: number = 1
      while(true){
        if(counter > 50) throw new Error('Timeout waiting for user to get gas')

        if(+(await this.getBalance()) > 0){
          return true
        }

        await new Promise(r => setTimeout(r, 5000)) // Sleeps for 5 seconds
        counter += 1
      }
    }
}
