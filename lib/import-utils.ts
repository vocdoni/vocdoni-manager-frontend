import { RcFile } from 'antd/lib/upload'
import xlsx from 'xlsx'
import { StringDecoder } from 'string_decoder'

import { CSV_MIME_TYPE } from './constants'
import { FileReaderPromise, getBufferEncoding, getProperFileMimeType } from './file-utils'
import { extractDigestedPubKeyFromFormData, importedRowToString } from './util'
import { VotingFormImportData } from './types'

/**
 * Gives you the expected xlsx reader for the given RcFile
 *
 * @param RcFile The file
 */
export const getSpreadsheetReaderForFile = async (file: RcFile) : Promise<xlsx.WorkBook> => {
    const buffer = await FileReaderPromise(file)
    const mime = getProperFileMimeType(file)

    if (mime === CSV_MIME_TYPE) {
        const encoding = getBufferEncoding(buffer)
        const decoder = new StringDecoder(encoding as BufferEncoding)
        const contents = decoder.write(buffer)

        return xlsx.read(contents, {type: 'string'})
    }

    return xlsx.read(buffer, {type: 'buffer'})
}

export const getJSONFromWorksheet = (ws: xlsx.WorkSheet): string[][] => {
    return xlsx.utils.sheet_to_json(ws, { header: 1, raw: false });
}

type ParseStatus = {
    total: number
    current: number
}

export const parseSpreadsheetData = async (entityId: string, file: RcFile, cb?: (status: ParseStatus) => void): Promise<VotingFormImportData> => {
    const workbook = await getSpreadsheetReaderForFile(file)

    const firstSheetName = workbook.SheetNames[0]
    if (!firstSheetName || (firstSheetName && !workbook.Sheets[firstSheetName])) {
        throw new Error('The document does not contain a worksheet')
    }
    const worksheet = workbook.Sheets[firstSheetName]

    let parsed = getJSONFromWorksheet(worksheet)
    const title = parsed.shift()
    const result: VotingFormImportData = {
        title: title.reduce((i, j) => `${i},${j}`),
        digestedHexClaims: []
    }

    // Remove empty rows
    parsed = parsed.filter((row) => row.length > 0)
    if (typeof cb === 'function') {
        cb({
            current: 0,
            total: parsed.length,
        })
    }

    // Throw if mismatch in number of columns between title and any row
    parsed.every((row) => {
        if (row.length !== title.length) {
            throw new Error("found incompatible rows size")
        }
    })

    let count = 0
    result.digestedHexClaims = await Promise.all(parsed.map((row) => new Promise((resolve) => {
        setTimeout(() => {
            const claims = extractDigestedPubKeyFromFormData(importedRowToString(row, entityId)).digestedHexClaim
            if (typeof cb === 'function') {
                cb({
                    total: parsed.length,
                    current: ++count,
                })
            }
            resolve(claims)
        }, 50)
    }))) as string[]

    return result
}
