import sanitize from 'sanitize-html'
import { MultiLanguage } from 'dvote-js'
import { RcFile } from 'antd/lib/upload'
import { XLSX_MIME_TYPE, XLS_MIME_TYPE } from './constants'

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

export const sanitizeHtml = (html: MultiLanguage<string> | string) =>
    sanitize(html, {allowedTags: sanitize.defaults.allowedTags.concat(['img'])})

export const getProperFileMimeType = (file: RcFile) : string | null => {
    if (file.type && file.type.length > 0) {
        return file.type
    }

    const extension = file.name.substr(file.name.lastIndexOf('.') + 1)

    switch (extension) {
        case 'csv':
            return 'text/csv'
        case 'xls':
            return XLS_MIME_TYPE
        case 'xlsx':
            return XLSX_MIME_TYPE
        default:
            return null
    }
}
