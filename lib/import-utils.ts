import { RcFile } from 'antd/lib/upload'
import xlsx from 'xlsx'
import { StringDecoder } from 'string_decoder'

import { CSV_MIME_TYPE, XLSX_MIME_TYPE, XLS_MIME_TYPE } from './constants'
import { FileReaderPromise, getBufferEncoding, getProperFileMimeType } from './file-utils'

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
