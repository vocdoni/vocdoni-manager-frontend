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
export const downloadFileWithContents = (contents: string, settings : FileDownloadSettings) => {
    const data = Array.isArray(contents) ? contents.join("\n") : contents
    if (!settings) {
        settings = {}
    }
    if (!settings || (settings && !settings.filename)) {
        settings.filename = 'download.json'
    }
    if (!settings || (settings && !settings.mime)) {
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
