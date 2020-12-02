import React, { Component, ReactNode } from 'react'
import { UploadOutlined } from '@ant-design/icons'
import { Button, message, Upload } from 'antd'
import { RcFile, UploadProps } from 'antd/lib/upload'
import { RcCustomRequestOptions, UploadChangeParam, UploadFile } from 'antd/lib/upload/interface'
import { addFile } from 'dvote-js/dist/api/file'
import fileSize from 'filesize'

import { imageUploadMimeTypes, IMAGEUPLOAD_FILESIZE_LIMIT } from '../lib/constants'
import { FileReaderPromise } from '../lib/file-utils'
import { getGatewayClients } from '../lib/network'
import { main } from '../i18n'
import { IAppContext } from './app-context'

type State = {
    uploading: boolean,
    file: RcFile,
    fileList: UploadFile[],
}

export default class IPFSImageUpload extends Component<UploadProps & IAppContext, State> {
    state = {
        uploading: false,
        file: null,
        fileList: [],
    }

    beforeUpload(file: RcFile) : boolean {
        if (!imageUploadMimeTypes.includes(file.type)) {
            message.error(main.invalidImageError)

            return false
        }

        if (file.size > IMAGEUPLOAD_FILESIZE_LIMIT) {
            message.error(
                main.filesizeLimit.replace(
                    '%s',
                    fileSize(IMAGEUPLOAD_FILESIZE_LIMIT)
                )
            )

            return false
        }

        this.setState({
            file,
            uploading: true,
        })

        return true
    }

    onChange(info: UploadChangeParam) : void {
        if (info.file.status === 'removed') {
            this.setState({
                fileList: [],
                file: null,
                uploading: false,
            })
        } else if (info.fileList.length) {
            this.setState({
                // only retain last upload
                fileList: [info.fileList.pop()],
            })
        }
        if (info.file.status !== 'uploading') {
            this.setState({uploading: false})
        }
        if (this.props.onChange) {
            this.props.onChange(info)
        }
    }

    async request({file, filename, onError, onSuccess}: RcCustomRequestOptions) : Promise<any> {
        try {
            const buffer = await FileReaderPromise(file)
            const wallet = await this.props.web3Wallet.getWallet()
            const gateway = await getGatewayClients()
            const origin = await addFile(buffer, filename, wallet, gateway)
            return onSuccess({src: origin}, file)
        } catch (error) {
            return onError(error)
        }
    }

    render() : ReactNode {
        const text = this.state.uploading ? main.btnImageUploading : main.btnImageUpload
        return (
            <Upload
                beforeUpload={this.beforeUpload.bind(this)}
                customRequest={this.request.bind(this)}
                {...this.props}
                // onChange and fileList shall not be overwriten
                onChange={this.onChange.bind(this)}
                fileList={this.state.fileList}
            >
                <Button icon={<UploadOutlined />} type='text' size='small' loading={this.state.uploading}>
                    {text}
                </Button>
            </Upload>
        )
    }
}
