import { RcFile } from 'antd/lib/upload'
import { Buffer } from 'buffer'

import { getBufferEncoding, getProperFileMimeType, Uint8ToString } from './file-utils'
import { XLSX_MIME_TYPE, XLS_MIME_TYPE } from './constants'

const utf8 = [110,111,109,44,99,111,103,110,111,109,115,44,101,109,97,105,108,10,195,137,109,105,108,101,44,68,117,114,107,104,101,105,109,44,101,109,105,108,101,64,100,117,114,107,104,101,105,109,46,99,111,109,10]
const latin1 = [110,111,109,44,99,111,103,110,111,109,115,44,101,109,97,105,108,10,68,111,110,97,108,100,44,84,114,117,109,112,44,100,111,110,97,108,100,64,116,114,117,109,112,46,99,111,109,10,66,97,114,97,107,44,79,98,97,109,97,44,98,97,114,97,107,64,111,98,97,109,97,46,99,111,109,10,201,109,105,108,101,44,68,117,114,107,104,101,105,109,44,101,109,105,108,101,64,100,117,114,107,104,101,105,109,46,99,111,109,10]

describe('utils', () => {
    describe('getBufferEncoding', () => {
        it('returns proper mime for latin1', () => {
            expect(getBufferEncoding(Buffer.from(latin1))).toBe('latin1')
        })
        it('returns proper mime for utf8', () => {
            expect(getBufferEncoding(Buffer.from(utf8))).toBe('UTF-8')
        })
    })
    describe('getProperFileMimeType', () => {
        it('returns mime if it is set', () => {
            const file = {
                type: 'invented-mime',
            }
            expect(getProperFileMimeType(file as any)).toBe('invented-mime')
        })
        it('returns mime from extension', () => {
            let file = {
                type: '',
                name: 'test.testing.tests.csv',
            }
            expect(getProperFileMimeType(file as any)).toBe('text/csv')
            file = {
                type: '',
                name: 'test.testing.tests.xlsx',
            }
            expect(getProperFileMimeType(file as any)).toBe(XLSX_MIME_TYPE)
            file = {
                type: '',
                name: 'test.testing.tests.xls',
            }
            expect(getProperFileMimeType(file as any)).toBe(XLS_MIME_TYPE)
        })
    })

    describe('Uint8ToString', () => {
        const chars = [65, 66, 67, 68]
        it('properly converts Uint8Array to string', () => {
            expect(Uint8ToString(new Uint8Array(chars))).toEqual('ABCD')
        })
    })
})
