import Dexie from 'dexie'
// import fetch from "isomorphic-unfetch"

import { IWallet } from './types'
import { makeUid, throwIfNotBrowser } from './util'
import { Key } from 'react';

// const CACHE_REFRESH_INTERVAL = process.env.NODE_ENV == "production" ? 1000 * 60 * 2 : 1000 * 10

// BOOTSTRAP CACHE

export class DataCache extends Dexie {
    // lastUpdate: number = 0   // when the bootstrap was last fetched
    // updating: Promise<void> = null

    wallets: Dexie.Table<IWallet, number> // number = type of the primkey

    constructor() {
        super("DataCache");
        throwIfNotBrowser();
        // Every new version must keep the schema definition of the older ones
        this.version(1).stores({ wallets: '&name, seed, publicKey' });
        this.version(2).stores({ wallets: '&name, seed, publicKey, uid' });

        this.wallets = this.table("wallets");

        // REFRESH UPON CREATION
        // this.refresh().catch(err => console.error("Unable to refresh the bootstrap", err))
    }

    getAllWallets(): Promise<IWallet[]> {
        return this.wallets.toArray()
    }

    async getWallet(name: string): Promise<IWallet> {
        const wallet = await this.wallets.get({ name })

        if (!wallet) {
            return wallet
        }

        if (!wallet.uid) {
            // @ts-expect-error due to dixie expecting a number, although it properly works with key strings
            this.wallets.update(name, {
                uid: makeUid(),
            })
        }

        return this.wallets.get({ name });
    }

    addWallet(item: IWallet): Promise<Key> {
        return this.wallets.put(item);
    }

    // async refresh(): Promise<void> {
    //     if (this.updating) return this.updating

    //     this.updating = fetch("...").then(res => res.json())
    //         .then((bootstrap: DataCache) => {
    //             if (!bootstrap || !bootstrap.menus) throw new Error("Invalid bootstrap data")

    //             return this.populateDb(bootstrap)
    //         })

    //     await this.updating
    //     this.updating = null
    //     this.lastUpdate = Date.now()
    // }

    // private async populateDb(bootstrap: DataCache): Promise<any> {
    //     return this.cleanData()
    //         .then(() => Promise.all([
    //             this.entities.bulkPut(bootstrap.entities),
    //             this.processes.bulkPut(bootstrap.processes),
    //         ]))
    // }

    // private async cleanData(): Promise<any> {
    //     return Promise.all([
    //         this.entities.clear().catch(err => null),
    //         this.processes.clear().catch(err => null),
    //     ])
    // }

    // async get(): Promise<DataCache> {
    //     if (this.lastUpdate + CACHE_REFRESH_INTERVAL < Date.now()) {
    //         await this.refresh()
    //     }

    //     return {
    //         entities: await this.entities.toArray().catch(err => []),
    //         processes: await this.processes.toArray().catch(err => []),
    //     }
    // }
}
