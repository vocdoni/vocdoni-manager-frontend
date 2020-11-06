import React, { Component, ReactNode } from 'react'
import { UploadOutlined } from '@ant-design/icons'
import { Button, message, Upload } from 'antd'
import { RcFile, UploadProps } from 'antd/lib/upload'
import { RcCustomRequestOptions, UploadChangeParam, UploadFile } from 'antd/lib/upload/interface'
import { addFile } from 'dvote-js/dist/api/file'

import { imageUploadMimeTypes } from '../lib/constants'
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

        this.setState({file})

        return true
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
        return (

            <Upload
                beforeUpload={this.beforeUpload.bind(this)}
                customRequest={this.request.bind(this)}
                {...this.props}
                onChange={(info : UploadChangeParam) => {
                    if (info.file.status === 'removed') {
                        this.setState({
                            fileList: [],
                            file: null,
                        })
                    } else if (info.fileList.length) {
                        this.setState({
                            // only retain last upload
                            fileList: [info.fileList.pop()],
                        })
                    }
                    if (this.props.onChange) {
                        this.props.onChange(info)
                    }
                }}
                fileList={this.state.fileList}
            >
                <Button icon={<UploadOutlined />} type='text' size='small'>
                    Upload image
                </Button>
            </Upload>
        )
    }
}
