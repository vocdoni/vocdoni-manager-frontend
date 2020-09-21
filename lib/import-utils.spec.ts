import { getProperFileMimeType } from './import-utils'
import { RcFile } from 'antd/lib/upload'
import { XLSX_MIME_TYPE, XLS_MIME_TYPE } from './constants'

describe('utils', () => {
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
})
