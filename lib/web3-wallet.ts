import { Wallet, providers } from "ethers"
import { EtherUtils } from "dvote-js";
import { DataCache } from "./storage";
import { Key } from "react";
import { IWallet } from "./types";

let provider: providers.JsonRpcProvider = null

export enum AccountState {
    Unknown = "Unknown",
    Ok = "Ok"
}

export default class Web3Wallet {
    private wallet: Wallet;
    public acountState: AccountState = AccountState.Unknown;

    public getWallet(): Wallet {
      if(!this.isAvailable) throw new Error('Wallet not available');
      return this.wallet;
    }

    // Generates a wallet and stores it on IndexedDB
    public async store(name: string, seed: string, passphrase: string): Promise<Key> {
      const wallet = EtherUtils.Signers.walletFromSeededPassphrase(passphrase, seed);
      const db = new DataCache();
      return await db.wallets.put({ name, seed, publicKey: wallet["signingKey"].publicKey });
    }

    // Gets all the stored wallet accounts from IndexedDB
    public async getStored(): Promise<Array<IWallet>>  {
      const db = new DataCache();
      return await db.wallets.toArray();
    }

    // Loads a wallet form IndexedDB if the provided passphrase is correct
    public async load(name: string, passphrase: string): Promise<boolean> {
      const db = new DataCache();
      const storedWallet = await db.wallets.get({ name });

      const wallet = EtherUtils.Signers.walletFromSeededPassphrase(passphrase, storedWallet.seed);

      // We need to verify the generated wallet publicKey = stored public Key
      if(wallet["signingKey"].publicKey === storedWallet.publicKey){
        this.wallet = wallet;
        this.acountState = AccountState.Ok;
      }else{
        throw new Error('Wrong passphrase for wallet!');
      }

      return true;
    }

    public isAvailable(): boolean {
      return this.getAccountState() === AccountState.Ok;
    }

    public getAccountState(): AccountState {
        return this.acountState;
    }

    public async getAddress(): Promise<string> {
      if(!this.isAvailable) throw new Error('Wallet not available');

      return await this.wallet.getAddress();
    }

    // TODO: Sends some ETH to the active wallet
    public async fillGas(): Promise<boolean> {
      if(!this.isAvailable) throw new Error('Wallet not available');

      return true;
    }
}
