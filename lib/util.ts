import sanitize from 'sanitize-html'
import { MultiLanguage, CensusOffChainApi } from 'dvote-js'
import { ethers } from 'ethers'

export function isServer(): boolean {
    return typeof window === 'undefined'
}

export function throwIfNotBrowser(): void {
    if (typeof window === "undefined") throw new Error("The storage component should only be used on the web browser side")
}

export const isWriteEnabled = (): boolean =>
    process.env.BOOTNODES_URL_RW
    && process.env.BOOTNODES_URL_RW != '0'
    && process.env.BOOTNODES_URL_RW.length > 0

type FileDownloadSettings = {
    mime?: string
    filename?: string
}
export const downloadFileWithContents = (contents: string, settings?: FileDownloadSettings) => {
    const data = Array.isArray(contents) ? contents.join("\n") : contents
    if (!settings) {
        settings = {}
    }
    if (!settings.filename) {
        settings.filename = 'download.json'
    }
    if (!settings.mime) {
        settings.mime = 'application/json'
    }

    const element = document.createElement("a")
    const file = new Blob([data], { type: `${settings.mime};charset=utf-8` })
    element.href = URL.createObjectURL(file)
    element.download = settings.filename
    document.body.appendChild(element)
    element.click()
    element.remove()
}

export const sanitizeHtml = (html: MultiLanguage<string> | string): string =>
    sanitize(html, { allowedTags: sanitize.defaults.allowedTags.concat(['img', 'h1', 'h2']) })

export const getRandomInt = (max = 10) => Math.floor(Math.random() * Math.floor(max))

export const getRandomUnsplashImage = (size = '800x600'): string => {
    const categories = ['nature', 'architecture', 'pattern']
    const base = `https://source.unsplash.com/${size}/?`

    return base + categories[getRandomInt(categories.length)]
}

/**
 * Determines if the specified slice contains only numbers.
 * Careful: use only with objects. Arrays containing empty positions give false positive.
 *
 * @param slice The slice to be analized
 */
export const areAllNumbers = (slice: any) => {
    let found = false
    for (const i in slice) {
        if (typeof slice[i] !== 'number') {
            found = true
            break
        }
    }

    return !found
}

/**
 * Converts an object to an array. Note that it should only be used for objects
 * having numeric key values (obviously, as they're arrays, keys must be in series)
 *
 * @param slice Slice to be converted to array.
 */
export const toArray = (slice: any) => {
    const keys = Object.keys(slice).sort()
    const array = []
    for (const k in keys) {
        array[k] = slice[k]
    }
    return array
}

export const importedRowToString = (row: string[], entityId: string): string => {
    return row.reduce((i, j) => { return i + j }) + entityId
}

export const extractDigestedPubKeyFromFormData = (data: string): { privKey: string, digestedHexClaim: string } => {
    // TODO implement spaces/accents/capitals conversion ?
    const bytes = ethers.utils.toUtf8Bytes(data)
    const hashed = ethers.utils.keccak256(bytes)
    const tempWallet = new ethers.Wallet(hashed)
    return {
        privKey: tempWallet.privateKey,
        digestedHexClaim: CensusOffChainApi.digestPublicKey(tempWallet.publicKey),
    }
}

export const isHex = (hex: string): boolean => /^0x[0-9a-f]/i.test(hex)

export const findHexId = (id: string) => (sid: string): boolean => {
    const idIsHex = isHex(id)
    const sidIsHex = isHex(sid)

    if (!sidIsHex && idIsHex) {
        return `0x${sid}` === id
    } else if (sidIsHex && !idIsHex) {
        return `0x${id}` === sid
    }

    // none of the ids are prefixed
    return sid === id
}

/**
 * If domain contains `manager`, will be replaced with `app`
 *
 * @param path The path to be appended
 */
export const appLink = (path: string): string => {
    const { location } = window

    if (/^manager/.test(location.hostname)) {
        return location.origin.replace('//manager.', '//app.') + path
    }

    return location.origin + path
}

/**
 * Generates ranges of numbers.
 *
 * @param start Begining range number
 * @param end End range number
 */
export const range = (start: number, end: number): number[] => {
    const result: number[] = []
    for (let i = start; i < end; i++) {
        result.push(i)
    }
    return result
}

type BrowserProfile = {
    userAgent: string,
    environment: string,
    pageId: string,
}

export const browserProfile = (currentPage?: string): BrowserProfile => {
    let pageId = currentPage || location.pathname

    pageId = pageId.replace(/\/?#[\w\/]*/, '')

    if (!pageId.length) {
        pageId = '/'
    }

    return {
        userAgent: navigator.userAgent,
        environment: process.env.ETH_NETWORK_ENV || 'dev',
        pageId,
    }
}

export const makeUid = (): number => Math.floor(Math.random() * Math.pow(10, 8))
