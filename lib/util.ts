import sanitize from 'sanitize-html'
import { MultiLanguage } from 'dvote-js'
import { ethers } from 'ethers'
import { digestHexClaim } from 'dvote-js/dist/api/census'

export function isServer(): boolean {
    return typeof window === 'undefined'
}

export function throwIfNotBrowser(): void {
    if (typeof window === "undefined") throw new Error("The storage component should only be used on the web browser side")
}

export const isWriteEnabled = (): boolean => process.env.BOOTNODES_URL_RW && process.env.BOOTNODES_URL_RW.length > 0

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

export const sanitizeHtml = (html: MultiLanguage<string> | string) : string =>
    sanitize(html, {allowedTags: sanitize.defaults.allowedTags.concat(['img'])})

export const getRandomInt = (max = 10) => Math.floor(Math.random() * Math.floor(max))

export const getRandomUnsplashImage = (size = '800x600') : string => {
    const categories = ['nature', 'architecture', 'pattern']
    const base = `https://source.unsplash.com/${size}/?`

    return base + categories[getRandomInt(categories.length)]
}

export const areAllNumbers = (slice: any[]) => {
    let found = false
    for (const i in slice) {
        if (typeof slice[i] !== 'number') {
            found = true
            break
        }
    }

    return !found
}


export const importedRowToString = (row: string[], entityId: string): string => {
    return row.reduce((i, j) => { return i + j })  + entityId
}

export const extractDigestedPubKeyFromFormData = (data: string): {privKey: string, digestedHexClaim: string} => {
    // TODO implement spaces/accents/capitals conversion ?
    const bytes = ethers.utils.toUtf8Bytes(data)
    const hashed = ethers.utils.keccak256(bytes)
    const tempWallet = new ethers.Wallet(hashed)
    const pubKey = tempWallet['signingKey'].publicKey
    return {
        privKey: tempWallet.privateKey,
        digestedHexClaim: digestHexClaim(pubKey)
    }
}

export const isHex = (hex: string) : boolean => /^0x[0-9a-f]/i.test(hex)

export const findHexId = (id: string) => (sid: string) : boolean => {
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
export const appLink = (path: string) : string => {
    const { location } = window

    if (/^manager/.test(location.hostname)) {
        return location.origin.replace('//manager.', '//app.') + path
    }

    return location.origin + path
}
