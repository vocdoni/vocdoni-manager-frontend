export function isServer() {
    return typeof window === 'undefined'
}

export function throwIfNotBrowser() {
    if (typeof window === "undefined") throw new Error("The storage component should only be used on the web browser side")
}

export const isWriteReady = () : boolean => process.env.BOOTNODES_URL_RW && process.env.BOOTNODES_URL_RW.length > 0
