import { RcFile } from 'antd/lib/upload'
import xlsx from 'xlsx'
import { StringDecoder } from 'string_decoder'
import Bluebird from "bluebird"

import { CSV_MIME_TYPE } from './constants'
import { FileReaderPromise, getBufferEncoding, getProperFileMimeType } from './file-utils'
import { extractDigestedPubKeyFromFormData, importedRowToString } from './util'
import { VotingFormImportData } from './types'

/**
 * Gives you the expected xlsx reader for the given RcFile
 *
 * @param RcFile The file
 */
export function getSpreadsheetReaderForFile(file: RcFile) {
    return FileReaderPromise(file).then(buffer => {
        const mime = getProperFileMimeType(file)

        if (mime === CSV_MIME_TYPE) {
            const encoding = getBufferEncoding(buffer)
            const decoder = new StringDecoder(encoding as BufferEncoding)
            const contents = decoder.write(buffer)

            return xlsx.read(contents, { type: 'string' })
        }

        return xlsx.read(buffer, { type: 'buffer' })
    })
}

export const getJSONFromWorksheet = (ws: xlsx.WorkSheet): string[][] => {
    return xlsx.utils.sheet_to_json(ws, { header: 1, raw: false });
}

export function parseSpreadsheetData(entityId: string, file: RcFile): Promise<VotingFormImportData> {
    let result: VotingFormImportData

    return getSpreadsheetReaderForFile(file).then(workbook => {
        const firstSheetName = workbook.SheetNames[0]
        if (!firstSheetName || (firstSheetName && !workbook.Sheets[firstSheetName])) {
            throw new Error('The document does not contain a worksheet')
        }
        const worksheet = workbook.Sheets[firstSheetName]

        let parsedRows = getJSONFromWorksheet(worksheet)
        const title = parsedRows.shift()
        result = {
            title: title.reduce((i, j) => `${i},${j}`),
            digestedHexClaims: []
        }

        // Remove empty rows
        parsedRows = parsedRows.filter((row) => row.length > 0)

        // Throw if mismatch in number of columns between title and any row
        parsedRows.every((row) => {
            if (row.length != title.length) {
                throw new Error("found incompatible rows size")
            }
        })

        // Limit / space the crypto operations
        return Bluebird.map(parsedRows, row => new Bluebird<string>(resolve => {
            setTimeout(() => {
                const strRow = importedRowToString(row, entityId)
                const digestedRow = extractDigestedPubKeyFromFormData(strRow)
                resolve(digestedRow.digestedHexClaim)
            }, 50)
        }), { concurrency: 75 })
    }).then(digestedClaims => {
        result.digestedHexClaims = digestedClaims
        return result
    })
}
