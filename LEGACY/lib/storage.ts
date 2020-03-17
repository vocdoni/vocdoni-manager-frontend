import Dexie from 'dexie'
import axios from "axios"

import {
    INewsFeed
} from "./types"

const CACHE_REFRESH_INTERVAL = 1000 * 60 // 1 minute

export class NewsFeeds extends Dexie {
    lastUpdate: number = 0   // when the bootstrap was last fetched
    updating: Promise<void> = null

    feeds: Dexie.Table<INewsFeed, number> // number = type of the primkey

    constructor() {
        super("NewsFeeds")
        ensureWebBrowser()

        this.version(1).stores({
            feeds: '_id, name',
            // singleton: '_id',
        })

        // The following lines are needed if your typescript
        // is compiled using babel instead of tsc:
        this.feeds = this.table("feeds")

        // this.refresh("").catch(err => console.error("Unable to refresh the news feed storage"))
    }

    // async refresh(url: string): Promise<void> {
    //     if (this.updating) return this.updating

    //     this.updating = axios.get(url)
    //         .then(response => response.data)
    //         .then((bootstrap: BootstrapData) => {
    //             // if (!bootstrap || !bootstrap.singleton) throw new Error("Invalid bootstrap data")

    //             return this.populate(bootstrap)
    //         })

    //     await this.updating
    //     this.updating = null
    //     this.lastUpdate = Date.now()
    // }

    // private async populate(bootstrap: BootstrapData): Promise<any> {
    //     return Promise.all([
    //         this.feeds.bulkPut(bootstrap.feeds),
    //         // this.singleton.put(bootstrap.singleton),    // WARNING: ADD A SINGLE ONE
    //     ])
    // }

    // async get(): Promise<BootstrapData> {
    //     if (this.lastUpdate + CACHE_REFRESH_INTERVAL < Date.now()) {
    //         await this.refresh()
    //     }

    //     return {
    //         feeds: await this.feeds.toArray(),
    //         // singleton: (await this.singleton.toArray())[0],    // STORED INTERNALLY AS AN ARRAY + CONSUMED AS A SINGLETON
    //     }
    // }
}

function ensureWebBrowser() {
    if (typeof window == "undefined") throw new Error("The storage component should only be used on the web browser side")
}
