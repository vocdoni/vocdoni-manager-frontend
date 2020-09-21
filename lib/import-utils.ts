import { RcFile } from 'antd/lib/upload'
import chardet from 'charset-detector'
import { Buffer } from 'buffer'
import xlsx from 'xlsx'
import { StringDecoder } from 'string_decoder'

import { CSV_MIME_TYPE, XLSX_MIME_TYPE, XLS_MIME_TYPE } from './constants'

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
            return encoding
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
        const buffer = Buffer.from(e.target.result)

        resolve(buffer)
    }
    reader.onerror = (e) => {
        reject(e)
    }

    reader.readAsArrayBuffer(file)
})

/**
 * Gives you the expected xlsx reader for the given RcFile
 *
 * @param RcFile The file
 */
export const getSpreadsheetReaderForFile = async (file: RcFile) => {
    const buffer = await FileReaderPromise(file)
    const mime = getProperFileMimeType(file)

    if (mime === CSV_MIME_TYPE) {
        const encoding = getBufferEncoding(buffer)
        const decoder = new StringDecoder(encoding)
        const contents = decoder.write(buffer)

        return xlsx.read(contents, {type: 'string'})
    }

    return xlsx.read(buffer, {type: 'buffer'})
}
