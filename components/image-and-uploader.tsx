import { Input, Modal, Form } from 'antd'
import { FormItemProps } from 'antd/lib/form'
import React, { Component, CSSProperties, ReactNode } from 'react'
import { UploadCloud } from 'react-feather'

import Image, { ImageProps } from './image'
import IPFSImageUpload from './ipfs-image-upload'

type ImageAndUploaderProps = ImageProps & {
    onConfirm: (image: string) => void,
    uploaderActive?: boolean,
}

type ImageAndUploaderState = {
    isModalVisible: boolean,
    src: string,
}

export default class ImageAndUploader extends Component<ImageAndUploaderProps, ImageAndUploaderState> {
    state : ImageAndUploaderState = {
        isModalVisible: false,
        src: null,
    }

    componentDidMount() : void {
        this.setState({src: this.props.src})
    }

    toggleVisible() : void {
        if (!this.props.uploaderActive) {
            return
        }

        this.setState({
            isModalVisible: !this.state.isModalVisible,
        })
    }

    onCancel() : void {
        this.setState({
            src: this.props.src,
        })
        this.toggleVisible()
    }

    onConfirm(image: string) : void {
        this.setState({isModalVisible: false})

        this.props.onConfirm(image || this.props.src)
    }

    render() : ReactNode {
        const { src } = this.props
        let isImageSet = src?.length > 0
        let contents = <UploadCloud onClick={this.toggleVisible.bind(this)} />
        const classes = ['image-uploader-wrapper', 'empty']
        if (isImageSet) {
            contents = <Image src={src} onClick={this.toggleVisible.bind(this)} />
            isImageSet = true
            // Removes 'empty'
            classes.pop()
        }
        const style : CSSProperties = {}
        if (this.props.uploaderActive) {
            style.cursor = 'pointer'
        }

        const isValid = isImageSet && /^(https?|ipfs):\/\//.test(this.state.src)
        const inputAttrs : FormItemProps = {}
        if (!isValid) {
            inputAttrs.validateStatus = 'error'
            inputAttrs.help = 'Must be either an http or an ipfs link'
        }
        return (
            <div className={classes.join(' ')} style={style}>
                {contents}
                <Modal
                    visible={this.state.isModalVisible}
                    closable={false}
                    onCancel={this.onCancel.bind(this)}
                    onOk={this.onConfirm.bind(this, this.state.src)}
                    okButtonProps={{
                        disabled: !isValid,
                    }}
                >
                    <Form.Item {...inputAttrs}>
                        <Input
                            type='text'
                            value={this.state.src}
                            placeholder={'URL'}
                            onChange={(e) => this.setState({src: e.target.value})}
                            addonAfter={
                                <IPFSImageUpload
                                    onChange={({file}) => {
                                        let image = ''
                                        if (file.status === 'done') {
                                            image = file.response.src
                                        }
                                        this.setState({
                                            src: image,
                                        })
                                    }}
                                />
                            }
                        />
                    </Form.Item>
                </Modal>
            </div>
        )
    }
}
