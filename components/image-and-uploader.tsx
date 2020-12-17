import { FileImageOutlined } from '@ant-design/icons'
import { Input, Modal } from 'antd'
import React, { Component, CSSProperties, ReactNode } from 'react'

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

    onConfirm(image: string) : void {
        this.setState({isModalVisible: false})

        this.props.onConfirm(image || this.props.src)
    }

    render() : ReactNode {
        const { src } = this.props
        let isImageSet = src?.length > 0
        let contents = <FileImageOutlined onClick={this.toggleVisible.bind(this)} />
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

        return (
            <div className={classes.join(' ')} style={style}>
                {contents}
                <Modal
                    visible={this.state.isModalVisible}
                    closable={false}
                    onCancel={this.toggleVisible.bind(this)}
                    onOk={this.onConfirm.bind(this, this.state.src)}
                >
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
                </Modal>
            </div>
        )
    }
}
