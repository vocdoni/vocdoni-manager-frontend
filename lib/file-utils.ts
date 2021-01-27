import chardet from 'charset-detector'
import { RcFile } from 'antd/lib/upload'

import { XLSX_MIME_TYPE, XLS_MIME_TYPE } from './constants'

/**
 * Gets a mime based on extension (only spreadsheet extensions added for now)
 *
 * @param RcFile The file which mime has to be predicted
 */
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

/**
 * Returns the expected encoding string by StringDecoder
 *
 *
 * @param buffer The buffer to get the encoding from
 */
export const getBufferEncoding = (buffer: Buffer): string => {
    const [encoding] = chardet(buffer)

    switch (encoding.charsetName) {
        case 'ISO-8859-1':
        case 'windows-1252':
            return 'latin1'
        case 'ISO-8859-2':
            return 'latin2'
        default:
            return encoding.charsetName
    }
}

/**
 * Handy Promise for reading RcFile with FileReader
 *
 * @param RcFile Which file to read the contents from.
 */
export const FileReaderPromise = (file: RcFile) : Promise<Buffer>=> new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
        const buffer = Buffer.from(e.target.result as string)

        resolve(buffer)
    }
    reader.onerror = (e) => {
        reject(e)
    }

    reader.readAsArrayBuffer(file)
})

/**
 * What would we do without stackoverflow, huh?
 *
 * @param u8a
 * @link https://stackoverflow.com/a/12713326/407456
 */
export const Uint8ToString = (u8a: Buffer | Uint8Array) : string => {
    const CHUNK_SZ = 0x8000
    const c = []
    for (let i = 0; i < u8a.length; i += CHUNK_SZ) {
        c.push(String.fromCharCode.apply(null, u8a.subarray(i, i + CHUNK_SZ)))
    }
    return c.join('')
}
