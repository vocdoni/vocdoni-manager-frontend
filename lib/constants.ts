export const headerBackgroundColor = '#173f56a3'

export const XLSX_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
export const XLS_MIME_TYPE = 'application/vnd.ms-excel'
export const ODS_MIME_TYPE = 'application/vnd.oasis.opendocument.spreadsheet'
export const CSV_MIME_TYPE = 'text/csv'

export const JPEG_MIME_TYPE = 'image/jpeg'
export const PNG_MIME_TYPE = 'image/png'

export const imageUploadMimeTypes = [
    JPEG_MIME_TYPE,
    PNG_MIME_TYPE,
]

export const excelMimeTypes = [
    XLSX_MIME_TYPE,
    XLS_MIME_TYPE,
    ODS_MIME_TYPE,
]

export const allowedImportTypes = [
    ...excelMimeTypes,
    CSV_MIME_TYPE,
]


export const MOMENT_DATE_FORMAT_SQL = 'YYYY-MM-DD'

export const HEX_REGEX = /^(0x)?[0-9a-fA-F]+$/

export const IMAGEUPLOAD_FILESIZE_LIMIT = 8 * 1024 * 1024 // 8MB

// These may be removed as soon as we update dvote-js
export const POLL_TYPE_NORMAL = 'poll-vote'
export const POLL_TYPE_ANONYMOUS = 'encrypted-poll'
