export const headerBackgroundColor = '#173f56a3'

export const XLSX_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
export const XLS_MIME_TYPE = 'application/vnd.ms-excel'
export const CSV_MIME_TYPE = 'text/csv'

export const excelMimeTypes = [
    XLSX_MIME_TYPE,
    XLS_MIME_TYPE,
]

export const allowedImportTypes = [
    ...excelMimeTypes,
    CSV_MIME_TYPE,
]
